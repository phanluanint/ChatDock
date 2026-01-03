
import React, { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Settings, Zap,
  LayoutGrid,
  X, Key,
  Save,
  Eye,
  EyeOff,
  MousePointerClick
} from 'lucide-react';
import ChatWindow from './components/ChatWindow';
import { AIModel, Message, AppSettings } from './types';
import { getGeminiResponse } from './services/gemini';
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
    subtitle: 'Web',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-400',
    activeColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border-blue-500/50',
    isWebview: true,
  },
  {
    id: AIModel.GEMINI_API,
    name: 'Gemini',
    subtitle: 'API',
    icon: Key,
    color: 'from-purple-500 to-indigo-400',
    activeColor: 'bg-gradient-to-r from-purple-500/20 to-indigo-400/20 border-purple-500/50',
    isWebview: false,
  },
];

// Settings Modal Component
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}> = ({ isOpen, onClose, settings, onSave }) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ geminiApiKey: apiKey });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Sparkles size={14} className="text-purple-400" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<AIModel>(AIModel.CHATGPT);
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([AIModel.CHATGPT, AIModel.CLAUDE]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('omnichat-settings');
    return saved ? JSON.parse(saved) : { geminiApiKey: '' };
  });

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('omnichat-settings', JSON.stringify(newSettings));
  };

  // State for Gemini API chat
  const [geminiMessages, setGeminiMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to clean up webviews when switching to non-webview modes
  useEffect(() => {
    // If we are in single mode and the active model is NOT a webview (e.g. Gemini API),
    // force close all webviews to ensure cleanliness.
    if (!isCompareMode && activeModel === AIModel.GEMINI_API) {
      WebviewManager.closeAll();
    }
  }, [isCompareMode, activeModel]);

  const handleSendMessage = useCallback(async (content: string, model: AIModel) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      model
    };

    if (model === AIModel.GEMINI_API) {
      if (!settings.geminiApiKey) {
        // Show settings if no API key
        setIsSettingsOpen(true);
        return;
      }

      setGeminiMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      const history = geminiMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await getGeminiResponse(content, history, settings.geminiApiKey);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'No response from AI.',
        timestamp: Date.now(),
        model: AIModel.GEMINI_API
      };

      setGeminiMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    }
  }, [geminiMessages, settings.geminiApiKey]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Tab bar with AI models, compare button, and settings */}
      <header className="shrink-0 h-12 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-2 z-50 relative">
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
                {model.subtitle && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-white/5'
                    }`}>
                    {model.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Compare mode toggle and Settings */}
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
            <span className="hidden sm:inline">{isCompareMode ? 'Exit' : 'Compare'}</span>
          </button>

          {/* Only show settings for Gemini API mode */}
          {(activeModel === AIModel.GEMINI_API) && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              title="Settings (Gemini API Key)"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content - no padding for webview models */}
      <main className="flex-1 overflow-hidden">
        {isCompareMode ? (
          /* Compare Mode - Grid of all AI services */
          <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            {AI_MODELS.filter(m => selectedModels.includes(m.id)).map((model) => (
              <ChatWindow
                key={`compare-${model.id}`}
                model={model.id}
                messages={model.id === AIModel.GEMINI_API ? geminiMessages : []}
                onSendMessage={(c) => handleSendMessage(c, model.id)}
                isLoading={isLoading && model.id === AIModel.GEMINI_API}
              />
            ))}
          </div>
        ) : (
          /* Single Mode - Full width chat */
          <ChatWindow
            key={activeModel}
            model={activeModel}
            messages={activeModel === AIModel.GEMINI_API ? geminiMessages : []}
            onSendMessage={(c) => handleSendMessage(c, activeModel)}
            isLoading={isLoading && activeModel === AIModel.GEMINI_API}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
