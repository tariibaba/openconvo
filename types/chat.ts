import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
}

export interface Message_v2 {
  role: Role;
  id: string;
  content: string;
  siblingCount: number;
  nextSiblingId?: string;
  prevSiblingId?: string;
  active: boolean;
  parentId?: string;
  childId?: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  temperature: number;
}

export interface Conversation {
  id: string;
  name: string;
  messageHeadId?: string;
  allMessages: Record<string, Message_v2>;
  messages: (Message | Message_v2)[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
}
