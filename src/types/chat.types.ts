import { ChatMessage } from "@/hooks/useChatState";

export interface ChatSession {
  sessionId: string;
  chats: ChatMessage[];
}

export interface StoredUserData {
  user: string;
  sessions: ChatSession[];
}

export interface SavedChat {
  user: string;
  sessions: ChatSession[];
}