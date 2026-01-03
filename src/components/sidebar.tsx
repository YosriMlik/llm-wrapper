"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Star,
  Archive,
  Puzzle,
  Search,
  MessageCircle,
  Settings,
  HelpCircle,
  X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ComingSoonDialog } from "./coming-soon-dialog";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

interface SidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ chats, selectedChatId, onNewChat, onSelectChat, onClose, isCollapsed = false }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "bg-background flex h-full flex-col border-r transition-all duration-300 lg:relative",
        isCollapsed ? "w-16 lg:w-16" : "w-80"
      )}>
      {/* Header */}
      <div className={cn(isCollapsed ? "px-3 py-4" : "p-4")}>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="w-full px-0 transition-all duration-300"
                  onClick={onNewChat}
                  variant="default"
                  size="icon">
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              className="flex-1 transition-all duration-300"
              onClick={onNewChat}
              variant="default"
              size="default">
              <Plus />
              <span className="ml-2">New Chat</span>
            </Button>
          )}
          {onClose && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Recent Chats */}
      <div className="flex min-h-0 flex-1 flex-col">
        {!isCollapsed && (
          <div className="px-4 py-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Recent Chats
              </h3>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="relative">
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn("space-y-1 pb-4", isCollapsed ? "px-2" : "px-4")}>
              {filteredChats.map((chat) => (
                isCollapsed ? (
                  <Tooltip key={chat.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                          "h-auto w-full p-2 justify-center hover:bg-accent hover:text-accent-foreground",
                          selectedChatId === chat.id && "bg-accent text-accent-foreground"
                        )}>
                        <MessageCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
                    <div className="flex w-full items-start gap-2">
                      <MessageCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{chat.title}</div>
                        <div className="text-muted-foreground mt-0.5 truncate text-xs">
                          {chat.preview}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className={cn("mt-auto space-y-1 border-t", isCollapsed ? "p-2" : "p-2")}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ComingSoonDialog functionality="Settings">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground w-full justify-center p-2 gap-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </ComingSoonDialog>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <ComingSoonDialog functionality="Settings">
            <Button 
              variant="ghost" 
              className="text-muted-foreground w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          </ComingSoonDialog>
        )}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ComingSoonDialog functionality="Help & Support">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground w-full justify-center p-2 gap-2">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </ComingSoonDialog>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Help & Support</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <ComingSoonDialog functionality="Help & Support">
            <Button 
              variant="ghost" 
              className="text-muted-foreground w-full justify-start gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </Button>
          </ComingSoonDialog>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}