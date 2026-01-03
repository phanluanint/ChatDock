
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutGrid, 
  Columns, 
  Square, 
  MessageSquare, 
  Settings, 
  Plus, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Cpu,
  Zap,
  Box
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { AIModel, LayoutMode, Message, ChatSession } from './types';
import { getGeminiResponse } from './services/gemini';

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<AIModel>(AIModel.GEMINI);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // State for different chat streams
  const [geminiMessages, setGeminiMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (content: string, model: AIModel) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      model
    };

    if (model === AIModel.GEMINI) {
      setGeminiMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      const history = geminiMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await getGeminiResponse(content, history);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'No response from AI.',
        timestamp: Date.now(),
        model: AIModel.GEMINI
      };
      
      setGeminiMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    } else {
        // Mock responses for others as they are intended for external webview simulation
        const mockMsg: Message = {
            id: Date.now().toString(),
            role: 'system',
            content: `Note: In this browser demo, ${model} is shown as a UI mockup. In a native Tauri environment, this would load the live site securely.`,
            timestamp: Date.now(),
            model
        };
        // For demonstration, we'll just alert or show a placeholder logic
        console.log(`Sending to ${model}: ${content}`);
    }
  }, [geminiMessages]);

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeModel={activeModel} 
        onSelectModel={setActiveModel} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 glass z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <h1 className="text-sm font-semibold tracking-wider uppercase text-gray-400">
              {activeModel === AIModel.UNIFIED ? 'Omni Unified View' : `${activeModel.toUpperCase()} Workspace`}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setLayoutMode('single')}
              className={`p-2 rounded-lg transition-all ${layoutMode === 'single' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Single View"
            >
              <Square size={18} />
            </button>
            <button 
              onClick={() => setLayoutMode('split')}
              className={`p-2 rounded-lg transition-all ${layoutMode === 'split' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Split View"
            >
              <Columns size={18} />
            </button>
            <button 
              onClick={() => setLayoutMode('grid')}
              className={`p-2 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors">
               <Plus size={14} /> New Project
             </button>
             <Settings className="text-gray-500 hover:text-gray-300 cursor-pointer" size={20} />
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 relative overflow-hidden p-4">
          <div className={`h-full w-full grid gap-4 transition-all duration-500 ${
            layoutMode === 'single' ? 'grid-cols-1' : 
            layoutMode === 'split' ? 'grid-cols-2' : 
            'grid-cols-2 grid-rows-2'
          }`}>
            
            {layoutMode === 'single' && (
              <ChatWindow 
                model={activeModel} 
                messages={activeModel === AIModel.GEMINI ? geminiMessages : []}
                onSendMessage={(c) => handleSendMessage(c, activeModel)}
                isLoading={isLoading && activeModel === AIModel.GEMINI}
              />
            )}

            {layoutMode === 'split' && (
              <>
                <ChatWindow 
                  model={AIModel.GEMINI} 
                  messages={geminiMessages}
                  onSendMessage={(c) => handleSendMessage(c, AIModel.GEMINI)}
                  isLoading={isLoading}
                />
                <ChatWindow 
                  model={AIModel.CHATGPT} 
                  messages={[]}
                  onSendMessage={(c) => handleSendMessage(c, AIModel.CHATGPT)}
                  isLoading={false}
                />
              </>
            )}

            {layoutMode === 'grid' && (
              <>
                <ChatWindow 
                  model={AIModel.GEMINI} 
                  messages={geminiMessages}
                  onSendMessage={(c) => handleSendMessage(c, AIModel.GEMINI)}
                  isLoading={isLoading}
                />
                <ChatWindow 
                  model={AIModel.CHATGPT} 
                  messages={[]}
                  onSendMessage={(c) => handleSendMessage(c, AIModel.CHATGPT)}
                  isLoading={false}
                />
                <ChatWindow 
                  model={AIModel.CLAUDE} 
                  messages={[]}
                  onSendMessage={(c) => handleSendMessage(c, AIModel.CLAUDE)}
                  isLoading={false}
                />
                <div className="glass rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 opacity-50">
                  <Monitor size={48} className="mb-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-500">Drop a new window here</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
