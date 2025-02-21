import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GalleryVerticalEnd, MessageSquarePlus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import logo from "../../public/textai.svg";

interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  date: string;
  user: string | null;
  error?: string;
  detectedLanguage?: string;
  relatedContent?: {
    summary?: string;
    translation?: string;
  };
}

interface ChatSession {
  sessionId: string;
  chats: ChatMessage[];
}

interface StoredUserData {
  user: string;
  sessions: ChatSession[];
}

interface GroupedChats {
  [date: string]: ChatMessage[];
}

interface AppSidebarProps {
  onNewChat: () => void;
  userName: string | null;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
}

export function AppSidebar({
  onNewChat,
  userName,
  currentSessionId,
  onSessionSelect,
}: AppSidebarProps) {
  const [chatGroups, setChatGroups] = useState<GroupedChats>({});

  const loadChats = useCallback(() => {
    if (!userName) return;

    try {
      const savedChats = JSON.parse(
        localStorage.getItem("pastChats") || "[]"
      ) as StoredUserData[];
      const userData = savedChats.find((data) => data.user === userName);

      if (userData?.sessions) {
        // Flatten all chats from all sessions
        const allChats = userData.sessions.flatMap((session) =>
          session.chats.map((chat) => ({
            ...chat,
            sessionId: session.sessionId,
          }))
        );

        // Sort chats by date
        const sortedChats = allChats.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const grouped = formatChats(sortedChats);
        setChatGroups(grouped);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
      setChatGroups({});
    }
  }, [userName]);

  useEffect(() => {
    loadChats();

    // Listen for chat updates
    const handleUpdate = () => loadChats();
    window.addEventListener("chatUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("chatUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadChats, userName]);

  const handleChatSelect = useCallback(
    async (chat: ChatMessage) => {
      try {
        const savedChats = JSON.parse(
          localStorage.getItem("pastChats") || "[]"
        );
        const userChats = savedChats.find(
          (data: StoredUserData) => data.user === userName
        );
        const session = userChats?.sessions?.find(
          (s: ChatSession) => s.sessionId === chat.sessionId
        );

        if (session) {
          onSessionSelect(chat.sessionId);
          // Update URL with session ID without page reload
          window.history.pushState({}, "", `?session=${chat.sessionId}`);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        toast({
          title: "Error",
          description: "Failed to load chat session",
          variant: "destructive",
        });
      }
    },
    [userName, onSessionSelect]
  );

  const sortedGroups = useMemo(
    () =>
      Object.entries(chatGroups).sort(
        (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
      ),
    [chatGroups]
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="w-full flex items-center gap-4">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex flex-1 items-center justify-between">
                  <div className="flex flex-col gap-0.5 leading-none">
                    <div className="flex items-center gap-2">
                      <Image
                        src={logo}
                        alt="AIFlow Logo"
                        className="size-5 dark:invert"
                      />
                      <span className="font-semibold">AIFlow</span>
                    </div>
                    <span className="text-xs">v1.0.0</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MessageSquarePlus
                          onClick={onNewChat}
                          className="size-8 p-1.5 rounded-md hover:bg-accent cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>New Chat</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="font-medium">Chat History</div>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {sortedGroups.length > 0 ? (
                  sortedGroups.map(([date, chats]) => (
                    <SidebarMenuSubItem key={date}>
                      <div className="flex flex-col gap-2 w-full">
                        <span className="text-sm font-medium text-muted-foreground px-4">
                          {date}
                        </span>
                        {chats.map((chat) => (
                          <SidebarMenuSubButton
                            key={chat.id}
                            onClick={() => handleChatSelect(chat)}
                            className={`w-full hover:bg-accent/50 transition-colors cursor-pointer ${
                              chat.sessionId === currentSessionId
                                ? "bg-accent/50"
                                : ""
                            }`}
                          >
                            <div className="flex flex-col gap-1 px-4 py-2">
                              <p className="line-clamp-2 text-sm">
                                {chat.message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(chat.date), "hh:mm a")}
                                </span>
                                {chat.relatedContent?.summary && (
                                  <span className="text-xs text-green-500">
                                    Summary available
                                  </span>
                                )}
                              </div>
                            </div>
                          </SidebarMenuSubButton>
                        ))}
                      </div>
                    </SidebarMenuSubItem>
                  ))
                ) : (
                  <SidebarMenuSubItem>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      No previous chats
                    </span>
                  </SidebarMenuSubItem>
                )}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

const formatChats = (chats: ChatMessage[]) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return chats.reduce((groups: { [key: string]: ChatMessage[] }, chat) => {
    const chatDate = new Date(chat.date);
    const dateString = chatDate.toDateString();

    let groupKey = format(chatDate, "MMM dd, yyyy");
    if (dateString === today) groupKey = "Today";
    if (dateString === yesterday) groupKey = "Yesterday";

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(chat);
    return groups;
  }, {});
};
