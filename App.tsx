
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  LayoutGrid,
  X,
  MousePointerClick,
} from 'lucide-react';
import ChatWebview from './components/ChatWebview';
import { AIModel } from './types';
import { WebviewManager } from './services/WebviewManager';

// AI Model configurations with brand colors
const AI_MODELS = [
  {
    id: AIModel.CHATGPT,
    name: 'ChatGPT',
    icon: MousePointerClick,
    color: 'from-emerald-500 to-teal-400',
    activeColor: 'bg-gradient-to-r from-emerald-500/20 to-teal-400/20 border-emerald-500/50',
    isWebview: true,
  },
  {
    id: AIModel.CLAUDE,
    name: 'Claude',
    icon: Zap,
    color: 'from-orange-500 to-amber-400',
    activeColor: 'bg-gradient-to-r from-orange-500/20 to-amber-400/20 border-orange-500/50',
    isWebview: true,
  },
  {
    id: AIModel.GEMINI_WEB,
    name: 'Gemini',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-400',
    activeColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border-blue-500/50',
    isWebview: true,
  },
  {
    id: AIModel.NOTEBOOK_LLM,
    name: 'Notebook LLM',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-400',
    activeColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border-blue-500/50',
    isWebview: true,
  }
];

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<AIModel>(AIModel.CHATGPT);
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([AIModel.CHATGPT, AIModel.CLAUDE]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // RECONCILE: Ensure only active model webviews are open
  useEffect(() => {
    const currentActiveModels = isCompareMode ? selectedModels : [activeModel];
    WebviewManager.reconcile(currentActiveModels);
  }, [isCompareMode, activeModel, selectedModels]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Tab bar with AI models, compare button */}
      <header className="shrink-0 h-12 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-2 z-50 relative">
        <div className="flex items-center gap-2">
          {/* Left: AI Model tabs */}
          <div className="flex items-center gap-1">
            {AI_MODELS.map((model) => {
              const Icon = model.icon;
              const isActive = isCompareMode
                ? selectedModels.includes(model.id)
                : activeModel === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    if (isCompareMode) {
                      setSelectedModels(prev => {
                        if (prev.includes(model.id)) {
                          return prev.length === 1 ? prev : prev.filter(id => id !== model.id);
                        }
                        const newSelection = [...prev, model.id];
                        return newSelection.length > 2 ? newSelection.slice(1) : newSelection;
                      });
                    } else {
                      setActiveModel(model.id);
                      setIsCompareMode(false);
                    }
                  }}
                  className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200
                  ${isActive
                      ? `${model.activeColor} border text-white`
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                    }
                `}
                >
                  <Icon size={14} className={isActive ? 'text-white' : ''} />
                  <span className="text-sm font-medium">{model.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Compare mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isCompareMode) {
                // Ensure active model is selected when entering compare mode
                setSelectedModels(prev => {
                  if (prev.includes(activeModel)) return prev;
                  const newSelection = [...prev, activeModel];
                  return newSelection.length > 2 ? newSelection.slice(1) : newSelection;
                });
              }
              setIsCompareMode(!isCompareMode);
            }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium
              ${isCompareMode
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }
            `}
            title="Compare AI responses"
          >
            {isCompareMode ? <X size={14} /> : <LayoutGrid size={14} />}
            <span className="hidden sm:inline">{isCompareMode ? 'Exit' : 'Side by side'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 overflow-hidden relative">
          {isCompareMode ? (
            /* Compare Mode - Grid of all AI services */
            <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              {AI_MODELS.filter(m => selectedModels.includes(m.id)).map((model) => (
                <ChatWebview
                  key={`compare-${model.id}`}
                  model={model.id}
                />
              ))}
            </div>
          ) : (
            /* Single Mode - Full width chat */
            <ChatWebview
              key={activeModel}
              model={activeModel}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
