
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Sparkles, User, AppWindow, Play, Key } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  // Synchronous check for initial state to avoid flicker
  const [isTauriEnv] = useState(() => checkIsTauri());

  // Derived state for webview mode
  const isNativeApiSupport = model === AIModel.GEMINI_API;
  const canEmbedWebview = isTauriEnv && !isNativeApiSupport;

  // We can just use a boolean for the view mode, no need for complex effects
  // If it's an embedded model and we are in Tauri, show webview.
  // Otherwise show native chat (or "not supported" message if implied).
  const showWebview = canEmbedWebview;

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

  // Show embedded webview when active
  if (showWebview) {
    return (
      <EmbeddedWebview
        key={`webview-${model}`}
        model={model}
        isActive={true}
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
              disabled={true}
              className="mt-6 px-5 py-2.5 bg-white/5 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed flex items-center gap-2 border border-white/10"
            >
              <Play size={16} />
              Not Available in Browser
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        ref={null}
                        className="rounded-md !bg-black/50 !p-3 !m-0 overflow-x-auto"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code {...props} className={`${className} bg-black/20 rounded px-1 py-0.5 font-mono text-xs`}>
                        {children}
                      </code>
                    )
                  },
                  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" />,
                  ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside space-y-1 mb-2" />,
                  ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside space-y-1 mb-2" />,
                  h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mb-2 mt-4 first:mt-0" />,
                  h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold mb-2 mt-3 first:mt-0" />,
                  h3: ({ node, ...props }) => <h3 {...props} className="text-md font-bold mb-1 mt-2 first:mt-0" />,
                  p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                  blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-2 border-gray-500 pl-4 py-1 italic my-2 bg-white/5" />,
                  table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table {...props} className="min-w-full text-left text-sm" /></div>,
                  thead: ({ node, ...props }) => <thead {...props} className="bg-white/10" />,
                  th: ({ node, ...props }) => <th {...props} className="px-3 py-2 border-b border-white/10 font-semibold" />,
                  td: ({ node, ...props }) => <td {...props} className="px-3 py-2 border-b border-white/5" />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
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
