import React, { useState } from 'react';
import { Loader2, X, Globe, AppWindow, Play } from 'lucide-react';
import { AIModel } from '../types';
import { useWebview } from './useWebview';

// Check if running in Tauri environment
const checkIsTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

const MODEL_NAMES: Record<AIModel, string> = {
  [AIModel.CHATGPT]: 'ChatGPT',
  [AIModel.CLAUDE]: 'Claude',
  [AIModel.GEMINI_WEB]: 'Gemini',
};

const MODEL_URLS: Record<AIModel, string> = {
  [AIModel.CHATGPT]: 'https://chatgpt.com',
  [AIModel.CLAUDE]: 'https://claude.ai',
  [AIModel.GEMINI_WEB]: 'https://gemini.google.com',
};

interface ChatWebviewProps {
  model: AIModel;
}

const ChatWebview: React.FC<ChatWebviewProps> = ({ model }) => {
  const [isTauri] = useState(() => checkIsTauri());
  const { status, errorMessage, retry, containerRef } = useWebview(model, isTauri);

  const handleOpenExternal = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(MODEL_URLS[model]);
    } catch (err) {
      console.error('Failed to open external link', err);
    }
  };

  // Browser fallback for non-Tauri environments
  if (!isTauri) {
    return (
      <div className="flex flex-col h-full glass border border-white/10 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
              <AppWindow className="text-indigo-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Web View Preview</h3>
            <p className="text-sm text-gray-500 mb-2">
              Browser constraints prevent loading {MODEL_NAMES[model]} directly.
            </p>
            <button
              disabled
              className="mt-6 px-5 py-2.5 bg-white/5 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed flex items-center gap-2 border border-white/10"
            >
              <Play size={16} />
              Not Available in Browser
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[#0a0a0a] relative flex flex-col mt-8">
      <div ref={containerRef} className="flex-1 w-full relative bg-[#0a0a0a]">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading {MODEL_NAMES[model]}...</p>
            <p className="text-xs text-gray-600 mt-2">Initializing secure webview environment</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-400 mb-2">Failed to load {MODEL_NAMES[model]}</p>
            <p className="text-xs text-red-400 mb-4 max-w-xs text-center break-all px-4">
              {errorMessage}
            </p>
            <div className="flex gap-2">
              <button
                onClick={retry}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Globe size={14} />
                Open in Browser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWebview;
