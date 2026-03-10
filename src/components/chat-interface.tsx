"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Sidebar } from "./sidebar";
import { WelcomeScreen } from "./welcome-screen";
import { ChatInput } from "./chat-input";
import { FetchLoader } from "./fetch-loader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check } from "lucide-react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_AI_MODEL } from "@/elysia/config/ai-models.config"
import { useUser } from "@/hooks/use-user"
import { ThemeToggle } from "./theme-toggle";
import { ModelSelectorClient } from "./model-selector-client";
import { api } from "@/lib/eden-treaty";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export function ChatInterface({ selectedModel = DEFAULT_AI_MODEL, onModelChange }: ChatInterfaceProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChat, setIsFetchingChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSelectedModel, setCurrentSelectedModel] = useState(selectedModel);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const { user } = useUser()

  // Update selected model when prop changes
  useEffect(() => {
    setCurrentSelectedModel(selectedModel);
  }, [selectedModel]);

  // Handle initial sidebar state after mount
  useEffect(() => {
    setIsMounted(true);
    // Open sidebar on desktop after hydration
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const refreshChatList = () => {
    // Call the global refresh function exposed by ChatList
    if (typeof window !== 'undefined' && (window as any).__refreshChatList) {
      (window as any).__refreshChatList();
    }
  };

  const handleNewChat = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    setSelectedChatId(null);
    setMessages([]);
    setInput("");
  };

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setIsFetchingChat(true);
    
    // Close sidebar on mobile after selecting a chat
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    
    // Fetch full chat from API
    try {
      const response = await fetch(`/api/chat/history/${chatId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.chat) {
          const loadedMessages = data.chat.messages || []
          setMessages(loadedMessages)
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error)
    } finally {
      setIsFetchingChat(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedChatId(null);
    setMessages([]);
    setInput(suggestion);
    // Trigger submit after a short delay
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Start with current chat or create new one
    let currentChatId = selectedChatId;
    let isNewChat = false;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Convert messages to OpenRouter format
      const openRouterMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: openRouterMessages,
          model: currentSelectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      setIsLoading(false);

      // Save to database in background if user is logged in
      if (user) {
        // Don't await - let it happen in background
        api.chat.history.post({
          messages: finalMessages,
          model: currentSelectedModel,
          chatId: currentChatId || undefined,
        })
          .then((saveResponse: any) => {
            if (saveResponse.data) {
              const saveData = saveResponse.data
              if (saveData.chatId) {
                // Update selected chat ID if it's a new chat
                if (!currentChatId) {
                  setSelectedChatId(saveData.chatId)
                  isNewChat = true;
                }
                // Only refresh chat list if this was a new chat
                if (isNewChat) {
                  refreshChatList()
                }
              }
            }
          })
          .catch((error: any) => {
            console.error('Failed to save chat history:', error)
          })
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I couldn't get a response. ${error instanceof Error ? error.message : "Please try again."}`,
      };
      setMessages([...updatedMessages, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setCurrentSelectedModel(modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Reset after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <FetchLoader isLoading={isFetchingChat} />
      {/* Overlay for mobile - only show when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:relative lg:z-auto",
          // On mobile: slide out completely when closed
          // On desktop: always visible, just collapsed
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
        <Sidebar
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={!isSidebarOpen}
        />
      </div>
      <div className="flex flex-1 flex-col transition-all duration-300 overflow-hidden">
        {/* Header with menu toggle, model selector and theme toggle */}
        <div className="flex items-center justify-between border-b px-4 py-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar">
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <ModelSelectorClient 
              selectedModel={currentSelectedModel}
              onModelChange={handleModelChange} 
            />
            <ThemeToggle />
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-lg min-w-0 max-w-full",
                    message.role === "user" ? "bg-cyan-100 dark:bg-cyan-900" : "bg-background"
                  )}
                >
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      {message.role === "user" ? (
                        <>
                          <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                          <AvatarFallback className="bg-zinc-300 dark:bg-zinc-500">{user?.name?.[0] || "U"}</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarFallback>🤖</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {message.role === "user" ? user?.name || "You" : "AI Assistant"}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content, message.id)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          code: ({ className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            return !isInline ? (
                              <pre className="bg-muted p-3 rounded-md overflow-x-auto max-w-full">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-muted px-1 py-0.5 rounded text-sm break-all" {...props}>
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children, ...props }: any) => (
                            <pre className="bg-muted p-3 rounded-md overflow-x-auto max-w-full" {...props}>
                              {children}
                            </pre>
                          ),
                          table: ({ children, ...props }: any) => (
                            <div className="overflow-x-auto my-4">
                              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" {...props}>
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children, ...props }: any) => (
                            <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left" {...props}>
                              {children}
                            </th>
                          ),
                          td: ({ children, ...props }: any) => (
                            <td className="border border-gray-200 dark:border-gray-700 px-4 py-2" {...props}>
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 p-4">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Input Area - Always visible at bottom */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
