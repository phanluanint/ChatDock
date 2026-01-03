
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { AIModel } from '../types';

interface EmbeddedWebviewProps {
  model: AIModel;
  isActive: boolean;
  onClose?: () => void;
}

const getModelUrl = (model: AIModel): string => {
  switch (model) {
    case AIModel.CHATGPT: return 'https://chatgpt.com';
    case AIModel.CLAUDE: return 'https://claude.ai';
    case AIModel.GEMINI_WEB: return 'https://gemini.google.com';
    default: return 'about:blank';
  }
};

const getModelTitle = (model: AIModel): string => {
  switch (model) {
    case AIModel.CHATGPT: return 'ChatGPT';
    case AIModel.CLAUDE: return 'Claude';
    case AIModel.GEMINI_WEB: return 'Gemini';
    default: return model;
  }
};

const EmbeddedWebview: React.FC<EmbeddedWebviewProps> = ({ model, isActive, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const createdRef = useRef(false);

  const createWebview = useCallback(async () => {
    if (!containerRef.current || createdRef.current) return;

    createdRef.current = true;
    setStatus('loading');
    setErrorMessage('');

    const rect = containerRef.current.getBoundingClientRect();
    const url = getModelUrl(model);
    const webviewLabel = `embedded-${model}-${Date.now()}`;

    console.log('Creating webview:', { url, webviewLabel, rect });

    try {
      // Import Tauri webview API
      const { Webview } = await import('@tauri-apps/api/webview');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');

      const currentWindow = getCurrentWindow();
      console.log('Current window:', currentWindow.label);

      // Create a webview within the current window
      const webview = new Webview(currentWindow, webviewLabel, {
        url: url,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      console.log('Webview created, waiting for events...');

      // Set up event listeners
      const createdUnlisten = await webview.once('tauri://created', async () => {
        console.log('Webview created successfully');
        webviewRef.current = webview;
        setStatus('ready');

        // Ensure correct position after creation (sometimes initial position is off)
        setTimeout(async () => {
          if (containerRef.current && webviewRef.current) {
            const newRect = containerRef.current.getBoundingClientRect();
            console.log('Correcting position:', newRect);
            try {
              await webviewRef.current.setPosition({
                x: Math.round(newRect.left),
                y: Math.round(newRect.top)
              });
              await webviewRef.current.setSize({
                width: Math.round(newRect.width),
                height: Math.round(newRect.height)
              });
            } catch (err) {
              console.error('Position correction failed:', err);
            }
          }
        }, 100);
      });

      const errorUnlisten = await webview.once('tauri://error', (e: any) => {
        console.error('Webview creation error:', e);
        const errorMsg = typeof e === 'string' ? e :
          e?.payload ? JSON.stringify(e.payload) :
            e?.message ? e.message :
              JSON.stringify(e);
        setStatus('error');
        setErrorMessage(errorMsg || 'Unknown error occurred');
        createdRef.current = false;
      });

      // Timeout fallback
      setTimeout(() => {
        if (status === 'loading') {
          console.log('Webview might be ready (timeout check)');
          // If still loading after 3 seconds, assume it's ready
          // (some webviews don't fire the created event properly)
          if (webviewRef.current === null) {
            webviewRef.current = webview;
            setStatus('ready');
          }
        }
      }, 3000);

    } catch (err: any) {
      console.error('Failed to create embedded webview:', err);
      setStatus('error');
      const errorMsg = err?.message || err?.toString() || 'Failed to create webview';
      setErrorMessage(errorMsg);
      createdRef.current = false;
    }
  }, [model, status]);

  const destroyWebview = useCallback(async () => {
    if (webviewRef.current) {
      try {
        console.log('Closing webview...');
        await webviewRef.current.close();
        console.log('Webview closed');
      } catch (err) {
        console.error('Failed to close webview:', err);
      }
      webviewRef.current = null;
    }
    createdRef.current = false;
  }, []);

  const handleOpenExternal = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(getModelUrl(model));
    } catch (err) {
      window.open(getModelUrl(model), '_blank');
    }
  }, [model]);

  // Create webview on mount
  useEffect(() => {
    if (isActive && !createdRef.current) {
      // Small delay to ensure container is rendered
      const timer = setTimeout(() => {
        createWebview();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, createWebview]);

  // Cleanup on unmount - CRITICAL: must close the webview
  useEffect(() => {
    // Store reference for cleanup
    const webviewToClose = webviewRef.current;

    return () => {
      console.log('Component unmounting, cleaning up webview...');
      createdRef.current = false;

      // Close the webview synchronously as possible
      if (webviewRef.current) {
        const wv = webviewRef.current;
        webviewRef.current = null;
        wv.close().catch((err: any) => {
          console.error('Error closing webview on unmount:', err);
        });
      }
    };
  }, []); // Empty deps to only run on unmount

  // Update webview position on resize
  useEffect(() => {
    if (!containerRef.current || !webviewRef.current || status !== 'ready') return;

    const updatePosition = async () => {
      if (!containerRef.current || !webviewRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      try {
        await webviewRef.current.setPosition({
          x: Math.round(rect.left),
          y: Math.round(rect.top)
        });
        await webviewRef.current.setSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      } catch (err) {
        console.error('Failed to update webview position:', err);
      }
    };

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updatePosition);

    // Initial update
    updatePosition();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [status]);

  return (
    <div className="h-full w-full overflow-hidden bg-[#0a0a0a] mt-8">
      {/* Webview Container - this is where the native webview will be positioned */}
      <div
        ref={containerRef}
        className="h-[calc(100vh-3rem)] w-full relative bg-[#0a0a0a]"
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading {getModelTitle(model)}...</p>
            <p className="text-xs text-gray-600 mt-2">This may take a moment</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-400 mb-2">Failed to load {getModelTitle(model)}</p>
            <p className="text-xs text-red-400 mb-4 max-w-xs text-center break-all">{errorMessage}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  createdRef.current = false;
                  createWebview();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                Open in Browser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddedWebview;
