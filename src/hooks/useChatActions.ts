import { useCallback } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UseChatState } from "./useChatState";
import { apiService } from "@/services/api";
import { useRetry } from "./useRetry";
import { SummarizeOptions } from "@/types/api.types";
import { toast } from "./use-toast";
import useSound from "use-sound";

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
  const [playMessageSound] = useSound("/messagePop.mp3");

  const checkBrowserSupport = useCallback(() => {
    if (!window.ai) {
      toast({
        title: "Unsupported Browser",
        description: "Please use Chrome with experimental features enabled",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, []);

  //text validation
  const validateText = useCallback((text: string) => {
    // Check for empty or short text
    if (!text.trim() || text.trim().length < 3) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid text",
        variant: "destructive",
      });
      return false;
    }

    // Check for numbers only
    if (/^\d+$/.test(text.trim())) {
      toast({
        title: "Invalid Input",
        description: "Please enter text, not just numbers",
        variant: "destructive",
      });
      return false;
    }

    // // Check for gibberish (basic check for random characters)
    // if (!/^[\p{L}\s.,!?-]+$/u.test(text.trim())) {
    //   toast({
    //     title: "Invalid Input",
    //     description: "Please enter meaningful text",
    //     variant: "destructive",
    //   });
    //   return false;
    // }

    return true;
  }, []);

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
            state.setDetectedLanguage(response.data.detectedLanguage);
            // Optionally handle confidence
            if (response.data.confidence < 0.7) {
              toast({
                title: "Low Confidence Detection",
                description: "Language detection may not be accurate",
                variant: "destructive",
                duration: 3000,
              });
            }
          } else {
            throw new Error(response.error);
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
    if (!checkBrowserSupport()) return;
    if (!validateText(state.input)) return;

    try {
      state.setLoading(true);
      const messageId = `msg_${Date.now()}`;
      const newChat = {
        id: messageId,
        sessionId: state.currentSessionId,
        message: state.input,
        date: new Date().toISOString(),
        user: state.userName,
        relatedContent: {},
      };

      playMessageSound();
      state.setChats((prev) => [...prev, newChat]);

      // Update localStorage with session grouping
      const savedChats = JSON.parse(localStorage.getItem("pastChats") || "[]");
      const userIndex = savedChats.findIndex(
        (chat: any) => chat.user === state.userName
      );

      if (userIndex >= 0) {
        const sessionIndex = savedChats[userIndex].sessions?.findIndex(
          (s: any) => s.sessionId === state.currentSessionId
        );

        if (sessionIndex >= 0) {
          savedChats[userIndex].sessions[sessionIndex].chats.push(newChat);
        } else {
          savedChats[userIndex].sessions = [
            ...(savedChats[userIndex].sessions || []),
            { sessionId: state.currentSessionId, chats: [newChat] },
          ];
        }
      } else {
        savedChats.push({
          user: state.userName,
          sessions: [{ sessionId: state.currentSessionId, chats: [newChat] }],
        });
      }

      localStorage.setItem("pastChats", JSON.stringify(savedChats));
      window.dispatchEvent(new Event("chatUpdated"));
      await handleDetectLanguage();
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      state.setInput("");
      state.setLoading(false);
    }
  }, [
    state.input,
    state.userName,
    state.currentSessionId,
    handleDetectLanguage,
  ]);

  const handleSummarize = useCallback(
    async (options: SummarizeOptions) => {
      if (!checkBrowserSupport()) return;

      const lastChat = state.chats[state.chats.length - 1];
      if (!lastChat?.message || lastChat.message.length < 150) {
        toast({
          title: "Invalid Input",
          description: "Text must be at least 150 characters long",
          variant: "destructive",
        });
        return;
      }

      try {
        state.setIsModalOpen(false);
        state.setLoading(true);
        state.setProcessingSummary(true);
        state.setSummaryText(null);

        await executeWithRetry({
          action: async () => {
            const response = await apiService.summarize(
              lastChat.message,
              options
            );
            if (response.success) {
              // Update the related content of the original message
              state.setChats((prev) =>
                prev.map((chat) =>
                  chat.id === lastChat.id
                    ? {
                        ...chat,
                        relatedContent: {
                          ...chat.relatedContent,
                          summary: response.data.summary,
                        },
                      }
                    : chat
                )
              );
              state.setSummaryText(response.data.summary);
            } else {
              throw new Error(response.error || "Summarization failed");
            }
          },
          errorTitle: "Summarization failed",
        });
      } catch (error) {
        toast({
          title: "Operation Failed",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      } finally {
        state.setLoading(false);
        state.setProcessingSummary(false);
      }
    },
    [state, executeWithRetry, checkBrowserSupport]
  );

  const handleTranslate = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    const lastChat = state.chats[state.chats.length - 1];
    if (!lastChat?.message) {
      toast({
        title: "No text to translate",
        description: "Please send a message first",
        variant: "destructive",
      });
      return;
    }

    try {
      state.setLoading(true);
      state.setProcessingTranslation(true);
      state.setTranslatedText(null);

      await executeWithRetry({
        action: async () => {
          const response = await apiService.translate(
            lastChat.message,
            state.selectedLanguage
          );
          if (response.success) {
            // Update the related content of the original message
            state.setChats((prev) =>
              prev.map((chat) =>
                chat.id === lastChat.id
                  ? {
                      ...chat,
                      relatedContent: {
                        ...chat.relatedContent,
                        translation: response.data.translated_text,
                      },
                    }
                  : chat
              )
            );
            state.setTranslatedText(response.data.translated_text);
          } else {
            throw new Error(response.error);
          }
        },
        errorTitle: "Translation failed",
      });
    } finally {
      state.setLoading(false);
      state.setProcessingTranslation(false);
    }
  }, [
    state.chats,
    state.selectedLanguage,
    executeWithRetry,
    checkBrowserSupport,
  ]);

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
