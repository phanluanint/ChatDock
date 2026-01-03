import { useState, useEffect, useRef, useCallback } from 'react';
import { AIModel } from '../types';
import { WebviewManager } from '../services/WebviewManager';

type WebviewStatus = 'loading' | 'ready' | 'error';

interface UseWebviewResult {
  status: WebviewStatus;
  errorMessage: string;
  retry: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MODEL_URLS: Record<AIModel, string> = {
  [AIModel.CHATGPT]: 'https://chatgpt.com',
  [AIModel.CLAUDE]: 'https://claude.ai',
  [AIModel.GEMINI_WEB]: 'https://gemini.google.com',
};

export const useWebview = (model: AIModel, isActive: boolean): UseWebviewResult => {
  const [status, setStatus] = useState<WebviewStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<any>(null);
  const labelRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const isCreatedRef = useRef(false);

  // Destroy webview instance
  const destroyWebview = useCallback(async () => {
    if (labelRef.current) {
      await WebviewManager.close(labelRef.current);
      labelRef.current = null;
    }
    webviewRef.current = null;
    isCreatedRef.current = false;
  }, []);

  // Update webview position to match container
  const updatePosition = useCallback(async () => {
    if (!containerRef.current || !webviewRef.current) return;
    if (!document.body.contains(containerRef.current)) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    try {
      await webviewRef.current.setPosition({ x: Math.round(rect.left), y: Math.round(rect.top) });
      await webviewRef.current.setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    } catch {
      // Ignore position update errors during transitions
    }
  }, []);

  // Create webview instance - only called on mount or retry
  const createWebview = useCallback(async () => {
    if (!isActive || !containerRef.current) return;
    // Prevent duplicate creation
    if (isCreatedRef.current) return;

    const currentAttempt = ++attemptRef.current;
    await destroyWebview();

    if (attemptRef.current !== currentAttempt) return;

    isCreatedRef.current = true;
    setStatus('loading');
    setErrorMessage('');

    const rect = containerRef.current.getBoundingClientRect();
    const url = MODEL_URLS[model];
    const label = `emb-${model}-${Date.now()}`;
    labelRef.current = label;

    try {
      const { Webview } = await import('@tauri-apps/api/webview');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');

      if (attemptRef.current !== currentAttempt) return;

      const webview = new Webview(getCurrentWindow(), label, {
        url,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      await WebviewManager.register(label, webview, model);
      webviewRef.current = webview;

      webview.once('tauri://created', () => {
        if (attemptRef.current !== currentAttempt) {
          WebviewManager.close(label);
          return;
        }
        setStatus('ready');
        setTimeout(updatePosition, 50);
      });

      webview.once('tauri://error', (e: any) => {
        if (attemptRef.current !== currentAttempt) return;
        setStatus('error');
        setErrorMessage(JSON.stringify(e));
        WebviewManager.close(label);
        isCreatedRef.current = false;
      });

      // Fallback if created event doesn't fire
      setTimeout(() => {
        if (attemptRef.current === currentAttempt && !webviewRef.current) {
          setStatus('ready');
        }
      }, 2000);

    } catch (err: any) {
      if (attemptRef.current !== currentAttempt) return;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to initialize webview');
      isCreatedRef.current = false;
    }
  }, [isActive, model, destroyWebview, updatePosition]);

  // Retry function that resets the created flag
  const retry = useCallback(() => {
    isCreatedRef.current = false;
    createWebview();
  }, [createWebview]);

  // Lifecycle: create on mount, destroy on unmount - stable deps only
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(createWebview, 100);
    return () => {
      clearTimeout(timer);
      destroyWebview();
    };
  }, [isActive, model]); // Only re-run when model or isActive changes

  // Position sync on window resize/move
  useEffect(() => {
    if (status !== 'ready') return;

    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        unlisteners.push(await win.onResized(updatePosition));
        unlisteners.push(await win.onMoved(updatePosition));
      } catch {
        // Ignore listener setup errors
      }
    };
    setupListeners();

    window.addEventListener('resize', updatePosition);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      unlisteners.forEach(fn => fn());
      window.removeEventListener('resize', updatePosition);
      resizeObserver?.disconnect();
    };
  }, [status, updatePosition]);

  return { status, errorMessage, retry, containerRef };
};
