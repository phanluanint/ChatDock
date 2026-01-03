
import React from 'react';
import { 
  Box, 
  ChevronLeft, 
  MessageCircle, 
  Zap, 
  Cpu, 
  Globe, 
  History, 
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { AIModel } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeModel, onSelectModel, onToggle }) => {
  const models = [
    { id: AIModel.UNIFIED, name: 'Unified Hub', icon: LayoutGrid, color: 'text-white' },
    { id: AIModel.GEMINI, name: 'Google Gemini', icon: Zap, color: 'text-blue-400' },
    { id: AIModel.CHATGPT, name: 'OpenAI GPT-4o', icon: Cpu, color: 'text-emerald-400' },
    { id: AIModel.CLAUDE, name: 'Anthropic Claude', icon: Box, color: 'text-orange-400' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 h-full bg-[#0a0a0a] border-r border-white/10 flex flex-col z-30">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Globe size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">OmniHub</span>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-white/5 rounded-md text-gray-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        <p className="px-2 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Workspace</p>
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              activeModel === model.id 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <model.icon size={18} className={`${activeModel === model.id ? model.color : 'text-gray-500 group-hover:text-gray-300'}`} />
            <span className="text-sm font-medium">{model.name}</span>
          </button>
        ))}

        <div className="pt-8 space-y-1">
          <p className="px-2 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Management</p>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all">
            <History size={18} />
            <span className="text-sm font-medium">History</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all">
            <ShieldCheck size={18} />
            <span className="text-sm font-medium">Data Privacy</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-br from-indigo-900/40 to-black p-4 rounded-2xl border border-indigo-500/20">
          <p className="text-xs text-indigo-300 font-semibold mb-1">Pro Plan Active</p>
          <p className="text-[10px] text-gray-500 mb-3">Unlimited cross-model requests and high-speed context windows.</p>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-indigo-500"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
