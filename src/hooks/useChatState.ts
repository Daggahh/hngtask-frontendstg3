import { useState, useRef, useCallback, useEffect } from "react";

export interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  date: string;
  error?: string;
  relatedContent?: {
    summary?: string;
    translation?: string;
  };
}

export interface UseChatState {
  input: string;
  setInput: (input: string) => void;
  chats: ChatMessage[];
  setChats: (
    chats: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  userName: string | null;
  setUserName: (name: string | null) => void;
  detectedLanguage: string | null;
  setDetectedLanguage: (lang: string | null) => void;
  translatedText: string | null;
  setTranslatedText: (text: string | null) => void;
  summaryText: string | null;
  setSummaryText: (text: string | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  detectingLanguage: React.RefObject<boolean>;
  resetState: () => void;
  loadUserChats: () => void;
  processingTranslation: boolean;
  processingSummary: boolean;
  setProcessingTranslation: (value: boolean) => void;
  setProcessingSummary: (value: boolean) => void;
  currentSessionId: string;
  setCurrentSessionId: (sessionId: string) => void;
  createNewSession: () => void;
}

export const useChatState = (): UseChatState => {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const detectingLanguage = useRef(false);
  const [processingSummary, setProcessingSummary] = useState(false);
  const [processingTranslation, setProcessingTranslation] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `session_${Date.now()}`
  );

  const resetState = useCallback(() => {
    setInput("");
    setSummaryText(null);
    setTranslatedText(null);
    setLoading(false);
    setProcessingSummary(false);
    setProcessingTranslation(false);
  }, []);

  const loadUserChats = useCallback(() => {
    try {
      const pastChats = JSON.parse(localStorage.getItem("pastChats") || "[]");
      const userChats = pastChats.find((chat: any) => chat.user === userName);
      if (userChats?.chats) {
        setChats(userChats.chats);
      }
    } catch (error) {
      console.error("Error loading user chats:", error);
    }
  }, [userName]);

  useEffect(() => {
    if (userName) {
      loadUserChats();
    }
  }, [userName, loadUserChats]);

  const createNewSession = useCallback(() => {
    setCurrentSessionId(`session_${Date.now()}`);
    setChats([]);
  }, []);

  return {
    input,
    setInput,
    chats,
    setChats,
    loading,
    setLoading,
    userName,
    setUserName,
    detectedLanguage,
    setDetectedLanguage,
    translatedText,
    setTranslatedText,
    summaryText,
    setSummaryText,
    selectedLanguage,
    setSelectedLanguage,
    isModalOpen,
    setIsModalOpen,
    isOpen,
    setIsOpen,
    detectingLanguage,
    resetState,
    loadUserChats,
    processingTranslation,
    processingSummary,
    setProcessingTranslation,
    setProcessingSummary,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
  };
};
