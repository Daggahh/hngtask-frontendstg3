import { useState, useRef } from "react";

export interface ChatMessage {
  message: string;
  date: string;
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
}

export const useChatState = (): UseChatState => {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const detectingLanguage = useRef(false);

  const resetState = () => {
    setUserName(null);
    setChats([]);
    setDetectedLanguage(null);
    setTranslatedText(null);
    setSummaryText(null);
  };

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
  };
};
