"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { WelcomeScreen } from "./welcome-screen";
import { ChatInterface } from "./chat-interface";
import { ChatInput } from "./chat-input";
import { ThemeToggle } from "./theme-toggle";
import { ModelSelector } from "./model-selector";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_AI_MODEL } from "@/elysia/config/ai-models.config"

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
}

export default function AiChat() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);

  const handleNewChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    setInput("");
  };

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setSelectedChatId(chatId);
      setMessages(chat.messages);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: suggestion.slice(0, 30) + "...",
      preview: suggestion.slice(0, 50) + "...",
      timestamp: new Date(),
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newChatId);
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

    // If no chat is selected, create a new one
    let currentChatId = selectedChatId;
    if (!currentChatId) {
      currentChatId = Date.now().toString();
      const newChat: Chat = {
        id: currentChatId,
        title: input.slice(0, 30) + "...",
        preview: input.slice(0, 50) + "...",
        timestamp: new Date(),
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setSelectedChatId(currentChatId);
    }

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

      //console.log("selectedModel is", selectedModel)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: openRouterMessages,
          model: selectedModel,
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

      // Update chat in sidebar
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: finalMessages,
                title: updatedMessages[0]?.content.slice(0, 30) + "..." || chat.title,
                preview: updatedMessages[0]?.content.slice(0, 50) + "..." || chat.preview,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I couldn't get a response. ${error instanceof Error ? error.message : "Please try again."}`,
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
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
          chats={chats}
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={!isSidebarOpen}
        />
      </div>
      <div className="flex flex-1 flex-col transition-all duration-300 overflow-hidden">
        {/* Header with menu toggle and theme toggle */}
        <div className="flex items-center justify-between border-b px-4 py-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar">
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <ModelSelector 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <ThemeToggle />
          </div>
        </div>
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {!selectedChatId ? (
            <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ChatInterface messages={messages} isLoading={isLoading} />
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