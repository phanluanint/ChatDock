
export enum AIModel {
  GEMINI = 'gemini',
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  UNIFIED = 'unified'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model: AIModel;
}

export interface ChatSession {
  id: string;
  model: AIModel;
  messages: Message[];
  title: string;
}

export type LayoutMode = 'single' | 'split' | 'grid';
