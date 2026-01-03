
import React, { useState } from 'react';
import { AppWindow, Play } from 'lucide-react';
import { AIModel } from '../types';
import EmbeddedWebview from './EmbeddedWebview';

// Check if running in Tauri environment (v2 compatible)
const checkIsTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

interface ChatWindowProps {
  model: AIModel;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ model }) => {
  // Synchronous check for initial state to avoid flicker
  const [isTauriEnv] = useState(() => checkIsTauri());

  // All models are now webview-based
  const canEmbedWebview = isTauriEnv;

  const getModelTitle = () => {
    switch (model) {
      case AIModel.CHATGPT: return 'ChatGPT';
      case AIModel.CLAUDE: return 'Claude';
      case AIModel.GEMINI_WEB: return 'Gemini';
      default: return model;
    }
  };

  // Show embedded webview when in Tauri environment
  if (canEmbedWebview) {
    return (
      <EmbeddedWebview
        key={`webview-${model}`}
        model={model}
        isActive={true}
      />
    );
  }

  // Fallback for non-Tauri environments (browser preview)
  return (
    <div className="flex flex-col h-full glass border border-white/10 overflow-hidden group">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
            <AppWindow className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Web View Preview
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Browser constraints prevent loading {getModelTitle()} directly. In the native app, this would be a full live session.
          </p>
          <button
            disabled={true}
            className="mt-6 px-5 py-2.5 bg-white/5 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed flex items-center gap-2 border border-white/10"
          >
            <Play size={16} />
            Not Available in Browser
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
