"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, Send } from "lucide-react";
import { ComingSoonDialog } from "./coming-soon-dialog";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading
}: ChatInputProps) {
  return (
    <div className="p-2">
      <div className="mx-auto max-w-3xl">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-muted flex items-center gap-2 rounded-lg border p-2">
            <ComingSoonDialog functionality="File attachment">
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
            </ComingSoonDialog>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            <ComingSoonDialog functionality="Voice input">
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Mic className="h-4 w-4" />
              </Button>
            </ComingSoonDialog>
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 p-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

