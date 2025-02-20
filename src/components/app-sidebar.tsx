import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GalleryVerticalEnd, MessageSquarePlus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
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
import { useChatState } from "@/hooks/useChatState";
import logo from "../../public/textai.svg";

interface ChatSession {
  sessionId: string;
  chats: ChatItem[];
}

interface StoredUserData {
  user: string;
  sessions: ChatSession[];
}

interface ChatItem {
  id: string;
  sessionId: string;
  message: string;
  date: string;
  user: string;
  relatedContent?: {
    summary?: string;
    translation?: string;
  };
}

interface GroupedChats {
  [date: string]: ChatItem[];
}

const formatChats = (chats: ChatItem[]) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return chats.reduce((groups: { [key: string]: ChatItem[] }, chat) => {
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [chatGroups, setChatGroups] = useState<GroupedChats>({});
  const state = useChatState();
  const router = useRouter();

  const loadChats = useCallback(() => {
    if (!state.userName) return;

    try {
      const savedChats = JSON.parse(
        localStorage.getItem("pastChats") || "[]"
      ) as StoredUserData[];
      const userData = savedChats.find((data) => data.user === state.userName);

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

        setChatGroups(formatChats(sortedChats));
      } else {
        setChatGroups({});
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      setChatGroups({});
    }
  }, [state.userName]);

  useEffect(() => {
    loadChats();

    const handleUpdate = () => loadChats();
    window.addEventListener("chatUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("chatUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadChats]);

  const handleNewChat = useCallback(() => {
    state.createNewSession(); // New method in useChatState
    state.resetState();
  }, [state]);

  const handleChatSelect = useCallback(
    (chat: ChatItem) => {
      state.setCurrentSessionId(chat.sessionId);
      state.resetState();

      // Find all chats from the same session
      const savedChats = JSON.parse(
        localStorage.getItem("pastChats") || "[]"
      ) as StoredUserData[];
      const userData = savedChats.find((data) => data.user === state.userName);
      const session = userData?.sessions.find(
        (s) => s.sessionId === chat.sessionId
      );

      if (session) {
        requestAnimationFrame(() => {
          state.setChats(session.chats);
        });
      }
    },
    [state]
  );

  const sortedGroups = useMemo(
    () =>
      Object.entries(chatGroups).sort(
        (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
      ),
    [chatGroups]
  );

  return (
    <Sidebar {...props}>
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
                          onClick={handleNewChat}
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
                <div className="font-medium">Chats History</div>
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
                            className="w-full hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex flex-col gap-1 px-4 py-2">
                              <p className="line-clamp-2 text-sm">
                                {chat.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(chat.date), "HH:mm")}
                                </span>
                                {chat.relatedContent?.summary && (
                                  <span className="text-xs text-muted-foreground">
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
