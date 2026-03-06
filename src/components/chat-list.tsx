"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isCollapsed?: boolean;
  userId?: string;
}

export function ChatList({ selectedChatId, onSelectChat, isCollapsed = false, userId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchChats();
    } else {
      setChats([]);
    }
  }, [userId]);

  const fetchChats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/history', {
        credentials: 'include',
        cache: 'no-store', // Ensure fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.chats) {
          const formattedChats: Chat[] = data.chats.map((chat: any) => ({
            id: chat.id,
            title: chat.title || 'Untitled Chat',
            preview: chat.title || 'No messages',
            timestamp: new Date(chat.createdAt),
          }));
          setChats(formattedChats);
        }
      } else {
        setError('Failed to load chats');
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh function
  useEffect(() => {
    (window as any).__refreshChatList = fetchChats;
    return () => {
      delete (window as any).__refreshChatList;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        {userId ? 'No chats yet' : 'Sign in to see your chats'}
      </div>
    );
  }

  return (
    <>
      {chats.map((chat) => (
        isCollapsed ? (
          <Tooltip key={chat.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "h-auto p-2 justify-center hover:bg-accent hover:text-accent-foreground",
                  selectedChatId === chat.id && "bg-accent text-accent-foreground"
                )}>
                <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{chat.title}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            key={chat.id}
            variant="ghost"
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              "h-auto w-full p-3 justify-start text-left hover:bg-accent hover:text-accent-foreground",
              selectedChatId === chat.id && "bg-accent text-accent-foreground"
            )}>
            <div className="flex w-full items-start justify-center gap-2">
              <MessageCircle className="h-4 mt-1 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{chat.title.length > 29 ? chat.title.slice(0, 29) + '...' : chat.title}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {chat.preview.length > 29 ? chat.preview.slice(0, 29) + '...' : chat.preview}
                </div>
              </div>
            </div>
          </Button>
        )
      ))}
    </>
  );
}
