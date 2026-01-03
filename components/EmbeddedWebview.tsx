
import React from 'react';
import { Loader2, X, Globe } from 'lucide-react';
import { AIModel } from '../types';
import { useWebviewWindow } from './useWebviewWindow';

interface EmbeddedWebviewProps {
  model: AIModel;
  isActive: boolean;
  onClose?: () => void;
}

const getModelTitle = (model: AIModel): string => {
  switch (model) {
    case AIModel.CHATGPT: return 'ChatGPT';
    case AIModel.CLAUDE: return 'Claude';
    case AIModel.GEMINI_WEB: return 'Gemini';
    default: return model;
  }
};

const EmbeddedWebview: React.FC<EmbeddedWebviewProps> = ({ model, isActive, onClose }) => {
  const { status, errorMessage, retry, containerRef } = useWebviewWindow(model, isActive);

  const handleOpenExternal = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      let url = 'about:blank';
      if (model === AIModel.CHATGPT) url = 'https://chatgpt.com';
      if (model === AIModel.CLAUDE) url = 'https://claude.ai';
      if (model === AIModel.GEMINI_WEB) url = 'https://gemini.google.com';
      await open(url);
    } catch (err) {
      console.error('Failed to open external link', err);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#0a0a0a] relative flex flex-col mt-8">
      {/* Header/Controls when in webview mode - optional, maybe just show connection status? */}

      {/* Webview Container Placeholders */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative bg-[#0a0a0a]"
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading {getModelTitle(model)}...</p>
            <p className="text-xs text-gray-600 mt-2">Initializing secure webview environment</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-400 mb-2">Failed to load {getModelTitle(model)}</p>
            <p className="text-xs text-red-400 mb-4 max-w-xs text-center break-all px-4">
              {errorMessage}
            </p>
            <div className="flex gap-2">
              <button
                onClick={retry}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
              >
                Retry Connection
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

export default EmbeddedWebview;
