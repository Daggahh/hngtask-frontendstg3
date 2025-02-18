"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Switch from "@/components/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export default function chatPage() {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<{ message: string; date: string }[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [userName, setUserName] = useState<string | null>(null);

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-gray-900">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 w-full">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Welcome {userName}!
              </h1>
            </div>
            <Switch />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="flex-1 flex flex-col h-full p-6">
              {/* Chat Output Box */}
              <Card className="flex-1 rounded shadow bg-white dark:bg-gray-800 overflow-y-auto mb-4">
                {chats.length > 0 ? (
                  chats.map((chat, index) => (
                    <p
                      key={index}
                      className="text-gray-800 dark:text-gray-300 mb-2"
                    >
                      {chat.message}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Start a conversation...
                  </p>
                )}

                {/* Detected Language Display */}
                {detectedLanguage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Detected Language: {detectedLanguage}
                  </p>
                )}

                {/* Summarized Output */}
                {summaryText && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Summary: {summaryText}
                  </p>
                )}

                {/* Translated Output */}
                {translatedText && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Translated Text: {translatedText}
                  </p>
                )}
              </Card>

              <div className="flex flex-col"></div>
              {/* Chat Input Box */}
              <div className="flex flex-col md:flex-row mb-4">
                <Input
                  className="flex-1 p-3 rounded-md dark:bg-gray-700 dark:text-white focus:ring-[#51DA4C] mb-4 md:mb-0"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button
                  className="ml-2 bg-[#51DA4C] text-white"
                  onClick={handleSend}
                >
                  <span role="img" aria-label="send">
                    ✉️
                  </span>{" "}
                  {/* Send icon */}
                </Button>
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
                <Button
                  className="ml-4 bg-[#51DA4C] text-white"
                  onClick={handleSend} // Trigger translation action
                >
                  Translate
                </Button>
              </div>
              {/* Summarize Button */}
              {input.length > 150 && detectedLanguage === "en" && (
                <Button
                  className="bg-[#51DA4C] text-white w-full mt-2"
                  onClick={handleSend} // Trigger summarize action
                >
                  Summarize
                </Button>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
