
export enum AIModel {
  GEMINI_API = 'gemini-api',
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

export interface AppSettings {
  geminiApiKey: string;
}
