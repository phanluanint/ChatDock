import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AIModel } from '../types';
import { WebviewManager } from '../services/WebviewManager';

interface UseWebviewWindowResult {
  status: 'loading' | 'ready' | 'error';
  errorMessage: string;
  retry: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const getModelUrl = (model: AIModel): string => {
  switch (model) {
    case AIModel.CHATGPT: return 'https://chatgpt.com';
    case AIModel.CLAUDE: return 'https://claude.ai';
    case AIModel.GEMINI_WEB: return 'https://gemini.google.com';
    default: return 'about:blank';
  }
};

export const useWebviewWindow = (model: AIModel, isActive: boolean): UseWebviewWindowResult => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const statusRef = useRef(status); // Ref to track status without triggering re-creation
  const [errorMessage, setErrorMessage] = useState('');

  // Sync ref
  useEffect(() => { statusRef.current = status; }, [status]);
  const containerRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<any>(null);
  const labelRef = useRef<string | null>(null); // Track label for fallback cleanup
  const isMountedRef = useRef(true);
  const creationAttemptRef = useRef(0);

  // Helper to safely log
  const log = useCallback((...args: any[]) => {
    console.log(`[Webview-${model}]`, ...args);
  }, [model]);

  // Cleanup/Destroy Webview
  const destroyWebview = useCallback(async () => {
    log('Closing webview instance');

    // 1. Try closing via ref or manager
    if (labelRef.current) {
      await WebviewManager.close(labelRef.current);
      labelRef.current = null;
    }

    // Also clear local ref just in case
    webviewRef.current = null;
  }, [log]);

  // Position Sync Logic
  const updatePosition = useCallback(async () => {
    if (!containerRef.current || !webviewRef.current || statusRef.current !== 'ready') return;
    if (!isMountedRef.current) return;

    // Check if container is in DOM and visible
    if (!document.body.contains(containerRef.current)) return;

    try {
      const rect = containerRef.current.getBoundingClientRect();
      // Only update if dimensions are valid
      if (rect.width === 0 || rect.height === 0) return;

      await webviewRef.current.setPosition({
        x: Math.round(rect.left),
        y: Math.round(rect.top)
      });
      await webviewRef.current.setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    } catch (err) {
      // Ignore specific "webview not found" errors if we're unmounting
      // console.warn('Position update failed:', err);
    }
  }, []);

  // Create Webview
  const createWebview = useCallback(async () => {
    if (!isActive || !containerRef.current) return;

    // Increment attempt counter to invalidate previous async flows
    const currentAttempt = ++creationAttemptRef.current;

    // Cleanup any existing instance first
    await destroyWebview();

    if (!isMountedRef.current || creationAttemptRef.current !== currentAttempt) return;

    setStatus('loading');
    setErrorMessage('');

    const rect = containerRef.current.getBoundingClientRect();
    const url = getModelUrl(model);
    const label = `emb-${model}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    labelRef.current = label; // Store label for cleanup

    log('Creating webview...', { label, url });

    try {
      // Dynamic import to support SSR/Non-Tauri envs loosely (though this hook assumes Tauri)
      const { Webview } = await import('@tauri-apps/api/webview');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');

      if (!isMountedRef.current || creationAttemptRef.current !== currentAttempt) return;

      const currentWindow = getCurrentWindow();
      const webview = new Webview(currentWindow, label, {
        url,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      // Register with Manager
      WebviewManager.register(label, webview);
      webviewRef.current = webview;

      // Event listeners
      webview.once('tauri://created', () => {
        if (!isMountedRef.current || creationAttemptRef.current !== currentAttempt) {
          // cleanup handled by useEffect -> destroyWebview
          WebviewManager.close(label);
          return;
        }
        log('Created successfully');
        setStatus('ready');
        // Initial position sync after a brief delay to ensure DOM settle
        setTimeout(updatePosition, 50);
      });

      webview.once('tauri://error', (e: any) => {
        if (!isMountedRef.current || creationAttemptRef.current !== currentAttempt) return;
        console.error('Creation error:', e);
        setStatus('error');
        setErrorMessage(JSON.stringify(e));
        WebviewManager.close(label);
      });

      // Fallback timeout if 'created' event doesn't fire
      setTimeout(() => {
        if (isMountedRef.current &&
          creationAttemptRef.current === currentAttempt &&
          statusRef.current === 'loading') {

          log('Timeout fallback: assuming ready');
          setStatus('ready');
        }
      }, 2000);

    } catch (err: any) {
      if (!isMountedRef.current || creationAttemptRef.current !== currentAttempt) return;
      console.error('Setup error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to initialize webview');
    }
  }, [isActive, model, log, destroyWebview, updatePosition]);

  // Lifecycle: Mount/Unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Initial creation
    if (isActive) {
      // Small delay to allow layout to settle
      const t = setTimeout(createWebview, 100);
      return () => clearTimeout(t);
    }

    return () => {
      isMountedRef.current = false;
      destroyWebview();
    };
  }, [isActive, createWebview, destroyWebview]);

  // Lifecycle: Position Observers
  useEffect(() => {
    if (status !== 'ready') return;

    const interval = setInterval(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('focus', updatePosition); // App focus often implies layout check needed

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('focus', updatePosition);
      resizeObserver?.disconnect();
    };
  }, [status, updatePosition]);

  return {
    status,
    errorMessage,
    retry: createWebview,
    containerRef
  };
};
