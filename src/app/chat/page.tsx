"use client";

import { useCallback, useEffect } from "react";
import Switch from "@/components/switch";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDownCircleIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import SendBtn from "@/components/sendBtn";
import TranslateBtn from "@/components/translateBtn";
import SummaryModal from "@/components/summaryModal";
import { useChatState } from "@/hooks/useChatState";
import { apiService } from "@/services/api";
import { useChatActions } from "@/hooks/useChatActions";

export default function chatPage() {
  const router = useRouter();
  const state = useChatState();
  const {
    handleSend,
    handleSummarize,
    handleTranslate,
    handleDetectLanguage,
    handleLogout,
  } = useChatActions(state, router);

  useEffect(() => {
    const loadUserData = () => {
      const storedUserName = localStorage.getItem("userName");
      const pastChats = JSON.parse(localStorage.getItem("pastChats") || "[]");

      if (storedUserName) {
        state.setUserName(storedUserName);

        const userChatHistory = pastChats.find(
          (chat: {
            user: string;
            chats: { message: string; date: string }[];
          }) => chat.user === storedUserName
        );
        if (userChatHistory) {
          state.setChats(userChatHistory.chats);
        }
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.input]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      state.setInput(e.target.value);
    },
    [state]
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-gray-900">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 w-full">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Welcome {state.userName}!
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LogOutIcon
                className="cursor-pointer hover:bg-[#DCF8DB] dark:hover:bg-[#1f2937] rounded-full p-2 w-10 h-10"
                onClick={handleLogout}
                aria-label="logout button"
                role="button"
              />
              <Switch />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-[0.3rem]">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="flex-1 flex flex-col rounded-xl h-full p-6">
              {/* Chat Output Box */}
              <Card className="flex-1 rounded shadow bg-white dark:bg-gray-800 overflow-y-auto mb-4 -me-6 -ms-6 -mt-6 rounded-tl-xl rounded-tr-xl">
                {state.chats.length > 0 ? (
                  state.chats.map((chat, index) => (
                    <p
                      key={index}
                      className="text-gray-800 dark:text-gray-300 mb-2 p-4"
                    >
                      {chat.message}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 pt-4 pl-4">
                    Start a conversation...
                  </p>
                )}

                {/* Summarize Button */}
                {(document.querySelector("#userInput") as HTMLTextAreaElement)
                  ?.value.length > 150 &&
                  state.detectedLanguage === "en" && (
                    <Button
                      className="bg-[#111313] font-semibold dark:bg-[#1f2937] text-white w-full mt-2"
                      onClick={() => state.setIsModalOpen(true)}
                    >
                      Summarize
                    </Button>
                  )}

                {/* Summary Modal */}
                <SummaryModal
                  isOpen={state.isModalOpen}
                  onClose={() => state.setIsModalOpen(false)}
                  onSummarize={handleSummarize}
                />

                {/* Detected Language Display */}
                {state.detectedLanguage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-4">
                    Detected Language:{" "}
                    {state.loading ? (
                      <Skeleton className="w-1/2 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    ) : (
                      state.detectedLanguage
                    )}
                  </p>
                )}

                {/* Summarized Output */}
                {state.loading ? (
                  <div className="mt-2 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Summary:{" "}
                      <Skeleton className="w-3/4 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    </p>
                  </div>
                ) : (
                  state.summaryText && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-4"
                    >
                      Summary: {state.summaryText}
                    </motion.p>
                  )
                )}

                {/* Translated Output */}
                {state.loading ? (
                  <div className="mt-2 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Translated Text:{" "}
                      <Skeleton className="w-3/4 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    </p>
                  </div>
                ) : (
                  state.translatedText && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-4"
                    >
                      Translated Text: {state.translatedText}
                    </motion.p>
                  )
                )}
              </Card>

              <div className="flex flex-col">
                {/* Chat Input Box */}
                <div className="flex flex-row md:flex-row mb-4">
                  <textarea
                    id="userInput"
                    value={state.input}
                    onChange={(e) => state.setInput(e.target.value)}
                    placeholder="Type your text here..."
                    className="w-full min-h-[50px] max-h-[200px] resize-none overflow-y-auto border border-gray-300 bg-white rounded-md dark:bg-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-700 dark:focus:ring-gray-300 transition-all"
                    onFocus={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      {
                        target.style.height = `${target.scrollHeight}px`;
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto"; // Reset height
                      target.style.height = `${target.scrollHeight}px`; // Set to content height
                    }}
                    onBlur={(e) => (e.target.style.height = "50px")} // Shrinks back when unfocused
                    aria-label="User input field"
                  ></textarea>
                  <SendBtn onClick={handleSend} />
                </div>

                {/* Language Selector */}
                <div className="flex mb-4 relative">
                  <div
                    className="relative w-full"
                    onClick={() => state.setIsOpen(!state.isOpen)}
                    onBlur={() => state.setIsOpen(false)}
                  >
                    <select
                      className="p-3 rounded-md w-full bg-white dark:bg-gray-700 dark:text-white appearance-none"
                      value={state.selectedLanguage}
                      onChange={(e) =>
                        state.setSelectedLanguage(e.target.value)
                      }
                      onBlur={() => state.setIsOpen(false)}
                    >
                      <option value="en">English (en)</option>
                      <option value="pt">Portuguese (pt)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="ru">Russian (ru)</option>
                      <option value="tr">Turkish (tr)</option>
                      <option value="fr">French (fr)</option>
                    </select>

                    {/* Dropdown Icon */}
                    <span
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${
                        state.isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <ChevronDownCircleIcon />
                    </span>
                  </div>

                  <TranslateBtn onClick={handleTranslate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
