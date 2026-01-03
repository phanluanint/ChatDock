
export enum AIModel {
  GEMINI_WEB = 'gemini-web',
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
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
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: AIModel;
}

// AppSettings interface removed - no longer needed without Gemini API
