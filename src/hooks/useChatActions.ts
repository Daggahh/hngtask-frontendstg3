import { useCallback } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ChatMessage, UseChatState } from "./useChatState";
import { apiService } from "@/services/api";
import { useRetry } from "./useRetry";
import { SummarizeOptions } from "@/types/api.types";
import { toast } from "./use-toast";
import useSound from "use-sound";

interface ChatActions {
  handleSend: () => Promise<void>;
  handleSummarize: (options: SummarizeOptions) => Promise<void>;
  handleTranslate: () => Promise<void>;
  handleDetectLanguage: (messageId: string) => Promise<void>;
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
    const trimmedText = text.trim();

    // Check for empty or short text
    if (!trimmedText || trimmedText.length < 3) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid text",
        variant: "destructive",
      });
      return false;
    }

    // Check for numbers only
    if (/^\d+$/.test(trimmedText)) {
      toast({
        title: "Invalid Input",
        description: "Please enter text, not just numbers",
        variant: "destructive",
      });
      return false;
    }

    // Detect gibberish patterns
    const gibberishPatterns = {
      repeatingLetters: /(.)\1{4,}/, // Same letter repeated 5+ times
      noVowels: /^[^aeiou]+$/i, // No vowels
      randomCharacters: /[^a-zA-Z0-9\s.,!?'-]{3,}/, // 3+ special chars in a row
      repeatingWords: /\b(\w+)\s+\1\s+\1\b/, // Same word repeated 3+ times
      alphabetStrings:
        /^[a-zA-Z\s]+$/i.test(trimmedText) &&
        /^(?:(?:abc|def|ghi|jkl|mno|pqr|stu|vwx|yz)\s*)+$/i.test(trimmedText),
    };

    // Get word statistics
    const words = trimmedText.split(/\s+/);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const uniqueRatio = uniqueWords.size / words.length;

    // Check for gibberish patterns
    if (
      gibberishPatterns.repeatingLetters.test(trimmedText) ||
      gibberishPatterns.repeatingWords.test(trimmedText) ||
      (gibberishPatterns.alphabetStrings && uniqueRatio < 0.4) ||
      (words.length > 5 && uniqueRatio < 0.2) // If long text has very few unique words
    ) {
      toast({
        title: "Invalid Input",
        description: "Please enter a meaningful text",
        variant: "destructive",
      });
      return false;
    }

    // // Check for excessive special characters
    // const specialCharCount = (trimmedText.match(/[^a-zA-Z0-9\s.,!?'-]/g) || [])
    //   .length;
    // const specialCharRatio = specialCharCount / trimmedText.length;

    // if (specialCharRatio > 0.3) {
    //   toast({
    //     title: "Invalid Input",
    //     description: "Too many special characters",
    //     variant: "destructive",
    //   });
    //   return false;
    // }
    // failed test for other languages

    return true;
  }, []);

  const handleDetectLanguage = useCallback(
    async (messageId: string) => {
      if (state.loadedContent[messageId]?.languageDetected) return;

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
              state.setLoadedContent(messageId, "languageDetected", true);
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
    },
    [state.input, state.loading, executeWithRetry]
  );

  const handleSend = useCallback(async () => {
    if (!checkBrowserSupport()) return;
    if (!validateText(state.input)) return;

    const messageId = `msg_${Date.now()}`;
    const newChat: ChatMessage = {
      id: messageId,
      sessionId: state.currentSessionId,
      message: state.input,
      date: new Date().toISOString(),
      //   user: state.userName,
      detectedLanguage: "",
      relatedContent: {},
    };

    playMessageSound();
    try {
      // Add to current session
      state.setChats((prev) => [...prev, newChat]);

      // Update localStorage
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

      // Detect language after sending
      const langResponse = await apiService.detectLanguage(state.input);
      if (langResponse.success) {
        const detectedLang = langResponse.data.detectedLanguage;
        newChat.detectedLanguage = detectedLang;
        state.setChats((prev) =>
          prev.map((chat) =>
            chat.id === messageId
              ? { ...chat, detectedLanguage: detectedLang }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      state.setInput("");
    }
  }, [state.input, state.currentSessionId, state.userName]);

  const handleSummarize = useCallback(
    async (options: SummarizeOptions) => {
      const lastChat = state.chats[state.chats.length - 1];

      // Early return conditions
      if (!lastChat?.message) {
        toast({
          title: "No Text to Summarize",
          description: "Please enter some text first",
          variant: "destructive",
        });
        return;
      }

      if (state.loadedContent[lastChat.id]?.summary) {
        toast({
          title: "Already Summarized",
          description: "This text has already been summarized",
          variant: "destructive",
        });
        return;
      }

      if (!checkBrowserSupport()) return;

      if (lastChat.message.length < 150) {
        toast({
          title: "Text Too Short",
          description:
            "Text must be at least 150 characters long for summarization",
          variant: "destructive",
        });
        return;
      }

      playMessageSound();
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
              // Update chat state with summary
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

              // Update localStorage
              const savedChats = JSON.parse(
                localStorage.getItem("pastChats") || "[]"
              );
              const userIndex = savedChats.findIndex(
                (chat: any) => chat.user === state.userName
              );

              if (userIndex >= 0) {
                const sessionIndex = savedChats[userIndex].sessions?.findIndex(
                  (s: any) => s.sessionId === state.currentSessionId
                );

                if (sessionIndex >= 0) {
                  const chatIndex = savedChats[userIndex].sessions[
                    sessionIndex
                  ].chats.findIndex((c: any) => c.id === lastChat.id);

                  if (chatIndex >= 0) {
                    savedChats[userIndex].sessions[sessionIndex].chats[
                      chatIndex
                    ] = {
                      ...lastChat,
                      relatedContent: {
                        ...lastChat.relatedContent,
                        summary: response.data.summary,
                      },
                    };
                    localStorage.setItem(
                      "pastChats",
                      JSON.stringify(savedChats)
                    );
                  }
                }
              }

              state.setSummaryText(response.data.summary);
              state.setLoadedContent(lastChat.id, "summary", true);

              toast({
                title: "Summary Created",
                description: "Text has been successfully summarized",
                variant: "default",
              });
            } else {
              throw new Error(response.error || "Summarization failed");
            }
          },
          errorTitle: "Summarization failed",
        });
      } catch (error) {
        toast({
          title: "Summarization Failed",
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

    // Check if there's text to translate
    if (!lastChat?.message) {
      toast({
        title: "No Text to Translate",
        description: "Please add some text to translate first",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Check if a target language is selected
    if (!state.selectedLanguage) {
      toast({
        title: "No Language Selected",
        description: "Please select a target language",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    playMessageSound();
    try {
      // First detect source language
      const detectResponse = await apiService.detectLanguage(lastChat.message);
      if (!detectResponse.success) {
        throw new Error("Could not detect source language");
      }

      // Check if trying to translate to same language
      if (detectResponse.data.detectedLanguage === state.selectedLanguage) {
        toast({
          title: "Same Language",
          description: "Text is already in the selected language",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      state.setLoading(true);
      state.setProcessingTranslation(true);
      state.setTranslatedText(null);

      await executeWithRetry({
        action: async () => {
          const response = await apiService.translate(
            lastChat.message,
            state.selectedLanguage
          );

          if (!response.success) {
            throw new Error(response.error);
          }

          if (response.success) {
            // Update chat state with translation
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

            // Update localStorage
            const savedChats = JSON.parse(
              localStorage.getItem("pastChats") || "[]"
            );
            const userIndex = savedChats.findIndex(
              (chat: any) => chat.user === state.userName
            );

            if (userIndex >= 0 && savedChats[userIndex].sessions) {
              const sessionIndex = savedChats[userIndex].sessions.findIndex(
                (s: any) => s.sessionId === state.currentSessionId
              );

              if (sessionIndex >= 0) {
                const chatIndex = savedChats[userIndex].sessions[
                  sessionIndex
                ].chats.findIndex((c: any) => c.id === lastChat.id);

                if (chatIndex >= 0) {
                  savedChats[userIndex].sessions[sessionIndex].chats[
                    chatIndex
                  ] = {
                    ...lastChat,
                    relatedContent: {
                      ...lastChat.relatedContent,
                      translation: response.data.translated_text,
                    },
                  };
                  localStorage.setItem("pastChats", JSON.stringify(savedChats));
                  window.dispatchEvent(new Event("chatUpdated"));
                }
              }
            }

            state.setTranslatedText(response.data.translated_text);
            state.setLoadedContent(lastChat.id, "translation", true);

            toast({
              title: "Translation Complete",
              description: "Text has been successfully translated",
              variant: "default",
            });
          } 
        },
        errorTitle: "Translation failed",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Translation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      state.setLoading(false);
      state.setProcessingTranslation(false);
    }
  }, [state, executeWithRetry, checkBrowserSupport]);

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
