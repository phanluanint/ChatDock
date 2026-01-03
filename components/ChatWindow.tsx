
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Sparkles, User, AppWindow, Play, Key } from 'lucide-react';
import { AIModel, Message } from '../types';
import EmbeddedWebview from './EmbeddedWebview';

// Check if running in Tauri environment (v2 compatible)
const checkIsTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

interface ChatWindowProps {
  model: AIModel;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ model, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [isWebviewActive, setIsWebviewActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check Tauri environment on mount
  useEffect(() => {
    setIsTauriEnv(checkIsTauri());
  }, []);

  // Auto-load webview for web-based models in Tauri environment
  useEffect(() => {
    const isWebviewModel = model !== AIModel.GEMINI_API;
    const shouldAutoLoad = isTauriEnv && isWebviewModel;
    setIsWebviewActive(shouldAutoLoad);
  }, [model, isTauriEnv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const getModelTitle = () => {
    switch (model) {
      case AIModel.CHATGPT: return 'ChatGPT';
      case AIModel.CLAUDE: return 'Claude';
      case AIModel.GEMINI_WEB: return 'Gemini';
      case AIModel.GEMINI_API: return 'Gemini API';
      default: return model;
    }
  };

  const isNativeApiSupport = model === AIModel.GEMINI_API;
  const canEmbedWebview = isTauriEnv && !isNativeApiSupport;

  // Show embedded webview when active
  if (isWebviewActive && canEmbedWebview) {
    return (
      <EmbeddedWebview
        key={`webview-${model}`}
        model={model}
        isActive={true}
        onClose={() => setIsWebviewActive(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full glass border border-white/10 overflow-hidden group">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {!isNativeApiSupport && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
              <AppWindow className="text-indigo-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {isTauriEnv ? `Load ${getModelTitle()}` : 'Web View Preview'}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {isTauriEnv
                ? `Click below to load ${getModelTitle()} directly inside this panel.`
                : `Browser constraints prevent loading ${model} directly. In the native app, this would be a full live session.`
              }
            </p>
            <button
              onClick={() => {
                if (canEmbedWebview) {
                  setIsWebviewActive(true);
                }
              }}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Play size={16} />
              Load {getModelTitle()} Here
            </button>
          </div>
        )}

        {isNativeApiSupport && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
              <Key className="text-purple-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Gemini API Chat
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Chat directly with Gemini using your API key.
            </p>
            <p className="text-xs text-gray-600">
              Start typing below to begin a conversation
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Sparkles size={14} className="text-purple-400" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
              : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
              }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <User size={14} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Loader2 size={14} className="text-purple-400 animate-spin" />
            </div>
            <div className="bg-white/5 text-gray-500 px-4 py-2.5 rounded-2xl border border-white/10 rounded-tl-none text-xs italic">
              Gemini is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !isNativeApiSupport}
            placeholder={
              !isNativeApiSupport
                ? `Use the embedded view above to chat...`
                : `Ask Gemini anything...`
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isNativeApiSupport}
            className="absolute right-2 top-1.5 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50 disabled:bg-gray-700"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
