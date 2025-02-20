"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useChatActions } from "@/hooks/useChatActions";

export default function ChatPage() {
  const router = useRouter();
  const state = useChatState();
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

      if (storedUserName) {
        state.setUserName(storedUserName);

        state.setChats([]);
      } else {
        router.push("/");
      }
    };

    loadUserData();
  }, [router, state.setChats, state.setUserName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.input, handleSend]);

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
              <Card className="flex-1 rounded shadow bg-white dark:bg-gray-800 overflow-y-auto mb-4 -me-6 -ms-6 -mt-6 rounded-tl-xl rounded-tr-xl chat-output">
                {state.chats.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 mt-2 ml-2">
                    Start a conversation...
                  </p>
                ) : (
                  state.chats.map((chat, index) => (
                    <div
                      key={index}
                      className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
                    >
                      {/* Main Message */}
                      <div className="p-4">
                        <p
                          className={`${
                            chat.error
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {chat.error || chat.message}
                        </p>
                      </div>

                      {/* Summarize Button */}
                      {state.chats.length > 0 &&
                        state.chats[state.chats.length - 1].message.length >
                          150 &&
                        state.detectedLanguage === "en" && (
                          <Button
                            className="bg-[#111313] font-semibold w-fit text-white flex relative ml-auto mr-2 hover:bg-[#111313]"
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
                        <div className="flex items-center gap-2 mt-2 px-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Detected Language:
                          </span>
                          {state.loading ? (
                            <div className="flex-1">
                              <Skeleton className="h-4 w-20" />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {state.detectedLanguage}
                            </span>
                          )}
                        </div>
                      )}

                      {(state.summaryText || state.translatedText) &&
                        index === state.chats.length - 1 && (
                          <div className="ml-8 space-y-4">
                            {/* Loading States */}
                            {state.loading && (
                              <div className="space-y-4">
                                {state.processingSummary && (
                                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        Summary:
                                      </span>
                                      <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                  </div>
                                )}
                                {state.processingTranslation && (
                                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        Translation:
                                      </span>
                                      <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Results */}
                            {!state.loading && (
                              <>
                                {state.summaryText && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 mt-2"
                                  >
                                    <div className="flex items-start gap-2">
                                      <ChevronDownCircleIcon className="w-5 h-5 mt-1" />
                                      <div>
                                        <span className="font-medium">
                                          Summary:
                                        </span>
                                        <motion.p
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{
                                            duration: 1.5,
                                            ease: "easeOut",
                                          }}
                                          className="mt-1"
                                        >
                                          {state.summaryText}
                                        </motion.p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                                {state.translatedText && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                                  >
                                    <div className="flex items-start gap-2">
                                      <ChevronDownCircleIcon className="w-5 h-5 mt-1" />
                                      <div>
                                        <span className="font-medium">
                                          Translation:
                                        </span>
                                        <motion.p
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{
                                            duration: 1.5,
                                            ease: "easeOut",
                                          }}
                                          className="mt-1"
                                        >
                                          {state.translatedText}
                                        </motion.p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                    </div>
                  ))
                )}
              </Card>

              <div className="flex flex-col">
                {/* Chat Input Box */}
                <div className="flex flex-row md:flex-row mb-4">
                  <textarea
                    ref={inputRef}
                    id="userInput"
                    value={state.input}
                    onChange={handleInputChange}
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
                    aria-label="Chat input"
                    role="textbox"
                    aria-multiline="true"
                  ></textarea>
                  <SendBtn onClick={handleSend} />
                </div>

                {/* Language Selector */}
                <div className="flex mb-4 relative">
                  <div
                    className="relative w-full"
                    onClick={() => state.setIsOpen(!state.isOpen)}
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
