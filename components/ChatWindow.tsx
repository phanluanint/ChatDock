
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Sparkles, User, ExternalLink } from 'lucide-react';
import { AIModel, Message } from '../types';

interface ChatWindowProps {
  model: AIModel;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ model, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const getModelUrl = () => {
    switch(model) {
      case AIModel.CHATGPT: return 'https://chatgpt.com';
      case AIModel.CLAUDE: return 'https://claude.ai';
      case AIModel.GEMINI: return 'https://gemini.google.com';
      default: return '#';
    }
  };

  const isNativeSupport = model === AIModel.GEMINI;

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-white/10 overflow-hidden group">
      {/* Window Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs font-bold text-gray-400 tracking-wide uppercase">
            {model === AIModel.UNIFIED ? 'Universal Prompt' : model}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={getModelUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {!isNativeSupport && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Terminal className="text-gray-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Web View Preview</h3>
            <p className="text-sm text-gray-500">
              Browser constraints prevent loading {model} directly in an iframe. In the native OmniHub Tauri app, this would be a full live session.
            </p>
            <button 
              onClick={() => window.open(getModelUrl(), '_blank')}
              className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium transition-all"
            >
              Open External Site
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
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
          <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Loader2 size={14} className="text-indigo-400 animate-spin" />
            </div>
            <div className="bg-white/5 text-gray-500 px-4 py-2.5 rounded-2xl border border-white/10 rounded-tl-none text-xs italic">
              AI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative group/input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || (!isNativeSupport && model !== AIModel.UNIFIED)}
            placeholder={
                !isNativeSupport && model !== AIModel.UNIFIED 
                ? `Interaction restricted in preview...` 
                : `Type your request for ${model}...`
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || (!isNativeSupport && model !== AIModel.UNIFIED)}
            className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:bg-gray-700"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-600 font-medium tracking-wide px-1">
          <span className="flex items-center gap-1"><Terminal size={10}/> CMD+K for shortcuts</span>
          <span className="flex items-center gap-1"><Sparkles size={10}/> Gemini 1.5 Pro</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
