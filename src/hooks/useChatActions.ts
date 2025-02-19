import { useCallback } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UseChatState } from "./useChatState";
import { apiService } from "@/services/api";
import { useRetry } from "./useRetry";

interface SummarizeOptions {
  type: string;
  format: string;
  length: string;
}

interface ChatActions {
  handleSend: () => Promise<void>;
  handleSummarize: (options: SummarizeOptions) => Promise<void>;
  handleTranslate: () => Promise<void>;
  handleDetectLanguage: () => Promise<void>;
  handleLogout: () => void;
}

export const useChatActions = (
  state: UseChatState,
  router: AppRouterInstance
): ChatActions => {
  const { executeWithRetry } = useRetry();

  const handleDetectLanguage = useCallback(async () => {
    if (
      !state.input.trim() ||
      state.loading ||
      state.detectingLanguage.current
    ) {
      return;
    }

    try {
      state.detectingLanguage.current = true;
      state.setLoading(true);

      await executeWithRetry({
        action: async () => {
          const response = await apiService.detectLanguage(state.input);
          if (response.success) {
            state.setDetectedLanguage(response.data.language);
          }
        },
        errorTitle: "Language detection failed",
      });
    } finally {
      state.detectingLanguage.current = false;
      state.setLoading(false);
    }
  }, [state.input, state.loading, executeWithRetry]);

  const handleSend = useCallback(async () => {
    if (!state.input.trim()) return;

    try {
      state.setLoading(true);
      await handleDetectLanguage();

      const newChat = {
        message: state.input,
        date: new Date().toLocaleString(),
      };

      state.setChats((prevChats) => {
        const updatedChats = [...prevChats, newChat];
        localStorage.setItem("chats", JSON.stringify(updatedChats));
        return updatedChats;
      });
    } catch (error) {
      console.error("Send message failed:", error);
    } finally {
      state.setInput("");
      state.setLoading(false);
    }
  }, [state.input, handleDetectLanguage]);

  const handleSummarize = useCallback(
    async (options: SummarizeOptions) => {
      if (
        !options ||
        !state.input?.trim() ||
        state.detectedLanguage !== "en" ||
        state.input.length < 150
      ) {
        return;
      }

      try {
        state.setIsModalOpen(false);
        state.setLoading(true);
        state.setSummaryText(null);

        await executeWithRetry({
          action: async () => {
            const response = await apiService.summarize(state.input, options);
            if (response.success) {
              state.setSummaryText(response.data.summary);
            }
          },
          errorTitle: "Summarization failed",
        });
      } finally {
        state.setLoading(false);
      }
    },
    [state.input, state.detectedLanguage, executeWithRetry]
  );

  const handleTranslate = useCallback(async () => {
    if (!state.input?.trim() || !state.selectedLanguage) return;

    try {
      state.setLoading(true);
      state.setTranslatedText(null);

      await executeWithRetry({
        action: async () => {
          const response = await apiService.translate(
            state.input,
            state.selectedLanguage
          );
          if (response.success) {
            state.setTranslatedText(response.data.translated_text);
          }
        },
        errorTitle: "Translation failed",
      });
    } finally {
      state.setLoading(false);
    }
  }, [state.input, state.selectedLanguage, executeWithRetry]);

  const handleLogout = useCallback(() => {
    try {
      if (
        state.userName &&
        Array.isArray(state.chats) &&
        state.chats.length > 0
      ) {
        const pastChats = JSON.parse(localStorage.getItem("pastChats") || "[]");

        if (!pastChats.some((chat: any) => chat.user === state.userName)) {
          pastChats.push({ user: state.userName, chats: state.chats });
          localStorage.setItem("pastChats", JSON.stringify(pastChats));
        }
      }

      localStorage.removeItem("userName");
      localStorage.removeItem("chats");
      state.resetState();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [state.userName, state.chats, router]);

  return {
    handleSend,
    handleSummarize,
    handleTranslate,
    handleDetectLanguage,
    handleLogout,
  };
};
