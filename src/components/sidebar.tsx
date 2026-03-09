"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user"
import { ChatList } from "./recent-chats-list";

import {
  Plus,
  Search,
  Settings,
  HelpCircle,
  X,
  LogIn,
  Loader2,
  VerifiedIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ComingSoonDialog } from "./coming-soon-dialog";
import { GoogleAuthDialog } from "./auth/GoogleAuthDialog";
import { SettingsDialog } from "./settings-dialog";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/better-auth-client";


interface SidebarProps {
  selectedChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ selectedChatId, onNewChat, onSelectChat, onClose, isCollapsed = false }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, loading } = useUser()

  // Access user data directly from database
  const { name, email, image, id } = user || {}

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "bg-background flex h-full flex-col border-r transition-all duration-300 lg:relative box-border overflow-hidden",
        isCollapsed ? "w-16 lg:w-16" : "w-72"
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
                  <p>New Chat {!authClient.accountInfo}</p>
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
            <ScrollArea className="h-full w-full">
              <div className={cn("space-y-1 pb-4", isCollapsed ? "px-2" : "px-4")}>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                }>
                  <ChatList
                    selectedChatId={selectedChatId}
                    onSelectChat={onSelectChat}
                    isCollapsed={isCollapsed}
                    userId={id}
                  />
                </Suspense>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className={cn("mt-auto space-y-1 border-t", isCollapsed ? "p-2 flex flex-col items-center" : "p-2")}>
          {loading ? (
            isCollapsed ? (
              <div className="flex w-full justify-center p-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="flex w-full items-center gap-2 px-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-sm">Loading...</div>
              </div>
            )
          ) : user ? (
            isCollapsed ? (
              <div className="flex w-full justify-center p-2">
                {image && (
                  <img
                    src={image}
                    alt={name || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </div>
            ) : (
              <div className="flex w-full items-center gap-2 px-2 pb-3 pt-2 border-b">
                {image && (
                  <img
                    src={image}
                    alt={name || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-foreground truncate">{name || email}</span>
                  <VerifiedIcon className="w-4 h-4 " />
                </div>
              </div>
            )
          ) : null}
          {!loading && !user && (isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <GoogleAuthDialog functionality="Settings">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground w-full justify-center p-2 gap-2">
                    <LogIn className="h-4 w-4" />
                  </Button>
                </GoogleAuthDialog>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Log In</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <GoogleAuthDialog functionality="Settings">
              <Button
                variant="ghost"
                className="text-muted-foreground w-full justify-start gap-2 text-sm">
                <LogIn className="h-4 w-4" />
                <span>Log In</span>
              </Button>
            </GoogleAuthDialog>
          ))}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {user ? (
                  <SettingsDialog>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground w-full justify-center p-2 gap-2">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SettingsDialog>
                ) : (
                  <GoogleAuthDialog functionality="Settings">
                    <Button
                      variant="ghost"
                      className="text-muted-foreground w-full justify-center p-2 gap-2">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </GoogleAuthDialog>
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{user ? 'Settings' : 'Settings'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            user ? (
              <SettingsDialog>
                <Button
                  variant="ghost"
                  className="text-muted-foreground w-full justify-start gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </SettingsDialog>
            ) : (
              <GoogleAuthDialog functionality="Settings">
                <Button
                  variant="ghost"
                  className="text-muted-foreground w-full justify-start gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </GoogleAuthDialog>
            )
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
                className="text-muted-foreground w-full justify-start gap-2 text-sm">
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
