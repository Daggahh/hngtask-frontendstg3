"use client";

import { useEffect, useRef, useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import SendBtn from "@/components/sendBtn";
import TranslateBtn from "@/components/translateBtn";
import SummaryModal from "@/components/SummaryModal";

export default function chatPage() {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<{ message: string; date: string }[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryTries, setSummaryTries] = useState(0);
  const [translateTries, setTranslateTries] = useState(0);
  const [detectedLanguageTries, setDetectedLanguageTries] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const detectingLanguage = useRef(false);
  const options = {
    type: "key-points" as "key-points" | "tl;dr" | "teaser" | "headline",
    format: "markdown" as "markdown" | "plain-text",
    length: "short" as "short" | "medium" | "long",
  };

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    const pastChats = JSON.parse(localStorage.getItem("pastChats") || "[]");

    if (storedUserName) {
      setUserName(storedUserName);

      const userChatHistory = pastChats.find(
        (chat: { user: string; chats: { message: string; date: string }[] }) =>
          chat.user === storedUserName
      );
      if (userChatHistory) {
        setChats(userChatHistory.chats);
      }
    }
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
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await handleDetectLanguage();

    const newChat = { message: input, date: new Date().toLocaleString() };
    setChats((prevChats) => {
      const updatedChats = [...prevChats, newChat];
      localStorage.setItem("chats", JSON.stringify(updatedChats));
      return updatedChats;
    });

    setInput("");
    setLoading(false);
  };

  const handleSummarize = async (options: { type: string; format: string; length: string }) => {
    setIsModalOpen(false);

    if (!input.trim() || detectedLanguage !== "en" || input.length < 150)
      return;

    setLoading(true);
    setSummaryText(null);
    let attempts = 0;

    while (attempts < 2) {
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          body: JSON.stringify({ text: input }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to summarize text");
        }

        const data = await res.json();
        setSummaryText(data.summary);
        setLoading(false);
        return;
      } catch (error) {
        attempts++;
        setSummaryTries(attempts);

        toast({
          title: "Failed to summarize text",
          variant: "destructive",
          duration: 3000,
          description: "An error occurred. Please try again.",
          action: (
            <Button onClick={() => handleSummarize(options)} className="bg-red-500 text-white">
              Try Again
            </Button>
          ),
        });
      }
    }

    toast({
      variant: "destructive",
      title: "API Call Failed",
      description: "Please try again later.",
    });

    setLoading(false);
  };

  const handleTranslate = async () => {
    if (!input.trim()) return;
    await handleDetectLanguage();

    setLoading(true);
    setTranslatedText(null);
    let attempts = 0;

    while (attempts < 2) {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          body: JSON.stringify({ text: input, targetLang: selectedLanguage }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to translate text");
        }

        const data = await res.json();
        setTranslatedText(data.translation);
        setLoading(false);
        return;
      } catch (error) {
        attempts++;
        setTranslateTries(attempts);

        toast({
          title: "Translation Failed",
          variant: "destructive",
          description: "An error occurred. Please try again.",
          action: (
            <Button onClick={handleTranslate} className="bg-red-500 text-white">
              Try Again
            </Button>
          ),
        });
      }
    }

    toast({
      title: "API Call Failed",
      description: "Please try again later.",
      variant: "destructive",
    });

    setLoading(false);
  };

  const handleDetectLanguage = async () => {
    if (!input.trim() || loading || detectingLanguage.current) return;
    detectingLanguage.current = true;

    setLoading(true);
    setDetectedLanguage("");

    let attempts = 0;
    while (attempts < 2) {
      try {
        const res = await fetch("/api/detect-language", {
          method: "POST",
          body: JSON.stringify({ text: input }),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to detect language");
        }

        const data = await res.json();
        setDetectedLanguage(data.language);
        setLoading(false);
        return;
      } catch (error) {
        attempts++;
        setDetectedLanguageTries(attempts);

        toast({
          title: "Couldn't Detect Language",
          variant: "destructive",
          description: "An error occurred. Please try again.",
          action: (
            <Button
              onClick={handleDetectLanguage}
              className="bg-red-500 text-white"
            >
              Try Again
            </Button>
          ),
        });
      }
    }

    toast({
      title: "API Call Failed",
      description: "Please try again later.",
      variant: "destructive",
    });

    setLoading(false);
  };

  const handleLogout = () => {
    if (userName && chats.length > 0) {
      const pastChats = JSON.parse(localStorage.getItem("pastChats") || "[]");

      const existingUser = pastChats.find(
        (chat: { user: string; chats: { message: string; date: string }[] }) =>
          chat.user === userName
      );

      if (!existingUser) {
        pastChats.push({ user: userName, chats });
        localStorage.setItem("pastChats", JSON.stringify(pastChats));
      }
    }

    localStorage.removeItem("userName");
    localStorage.removeItem("chats");
    setUserName(null);
    setChats([]);
    setDetectedLanguage(null);
    setTranslatedText(null);
    setSummaryText(null);

    router.push("/");
  };

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
                Welcome {userName}!
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
                {chats.length > 0 ? (
                  chats.map((chat, index) => (
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
                  detectedLanguage === "en" && (
                    <Button
                      className="bg-[#111313] font-semibold dark:bg-[#1f2937] text-white w-full mt-2"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Summarize
                    </Button>
                  )}

                {/* Summary Modal */}
                <SummaryModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSummarize={handleSummarize}
                />

                {/* Detected Language Display */}
                {detectedLanguage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-4">
                    Detected Language:{" "}
                    {loading ? (
                      <Skeleton className="w-1/2 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    ) : (
                      detectedLanguage
                    )}
                  </p>
                )}

                {/* Summarized Output */}
                {loading ? (
                  <div className="mt-2 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Summary:{" "}
                      <Skeleton className="w-3/4 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    </p>
                  </div>
                ) : (
                  summaryText && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-4"
                    >
                      Summary: {summaryText}
                    </motion.p>
                  )
                )}

                {/* Translated Output */}
                {loading ? (
                  <div className="mt-2 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Translated Text:{" "}
                      <Skeleton className="w-3/4 h-5 bg-gray-300 dark:bg-gray-600 mt-2" />
                    </p>
                  </div>
                ) : (
                  translatedText && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-4"
                    >
                      Translated Text: {translatedText}
                    </motion.p>
                  )
                )}
              </Card>

              <div className="flex flex-col">
                {/* Chat Input Box */}
                <div className="flex flex-row md:flex-row mb-4">
                  <textarea
                    id="userInput"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
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
                    onClick={() => setIsOpen(!isOpen)}
                    onBlur={() => setIsOpen(false)}
                  >
                    <select
                      className="p-3 rounded-md w-full bg-white dark:bg-gray-700 dark:text-white appearance-none"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      onBlur={() => setIsOpen(false)}
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
                        isOpen ? "rotate-180" : "rotate-0"
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
