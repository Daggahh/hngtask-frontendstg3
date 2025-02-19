"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import SendBtn from "@/components/sendBtn";
import TranslateBtn from "@/components/translateBtn";

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
  const router = useRouter();

  useEffect(() => {
    const storedChats = localStorage.getItem("chats");
    const storedUserName = localStorage.getItem("userName");
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const detectedLang = "en";
    setDetectedLanguage(detectedLang);

    const newChat = { message: input, date: new Date().toLocaleString() };
    const updatedChats = [...chats, newChat];

    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    setInput("");

    if (input.length > 150) {
      const summary = input.slice(0, 150) + "...";
      setSummaryText(summary);
    }

    if (selectedLanguage !== detectedLang) {
      setTranslatedText(input);
    }
  };

  const handleSummarize = async () => {
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
        break;
      } catch (error) {
        attempts++;
        setSummaryTries(attempts);

        toast({
          title: "Failed to summarize text",
          variant: "destructive",
          duration: 3000,
          description: "An error occurred. Please try again.",
          action: (
            <Button onClick={handleSummarize} className="bg-red-500 text-white">
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

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("chats");
    setUserName(null);
    setChats([]);

    router.push("/ && window.location.reload()");
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
                className="cursor-pointer hover:bg-gray-300 rounded-full"
                onClick={handleLogout}
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
                {input.length > 150 &&
                  detectedLanguage === "en" &&
                  !summaryText && (
                    <Button
                      className="bg-[#111313] font-semibold dark:bg-[#1f2937] text-white w-full mt-2"
                      onClick={handleSummarize}
                    >
                      Summarize
                    </Button>
                  )}

                {/* Detected Language Display */}
                {detectedLanguage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-4">
                    Detected Language: {detectedLanguage}
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
                {translatedText && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 pl-4 pr-4">
                    Translated Text: {translatedText}
                  </p>
                )}
              </Card>

              <div className="flex flex-col">
                {/* Chat Input Box */}
                <div className="flex flex-row md:flex-row mb-4">
                  <Input
                    className="flex-1 p-3 h-[3.75rem] bg-white rounded-md dark:bg-gray-700 dark:text-white focus:ring-[#51DA4C] mb-4 md:mb-0"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <SendBtn onClick={handleSend} />
                </div>

                {/* Language Selector */}
                <div className="flex mb-4">
                  <select
                    className="p-3 rounded-md dark:bg-gray-700 dark:text-white flex-1"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en">English (en)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="tr">Turkish (tr)</option>
                    <option value="fr">French (fr)</option>
                  </select>
                  <TranslateBtn onClick={handleSend} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
