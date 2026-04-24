"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Mic, Send } from "lucide-react";
import { ComingSoonDialog } from "./coming-soon-dialog";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
            <div className="flex-1 relative">
              {/* {!input && (
                <div className="absolute inset-0 flex items-center pointer-events-none text-sm text-muted-foreground">
                  Ask me anything...
                </div>
              )} */}
              <textarea
              value={input}
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                handleInputChange(e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    handleSubmit(e as any);
                  }
                }
              }}
              placeholder="Ask anything ..."
              className="mt-2 w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none outline-none min-h-[28px] max-h-[200px] overflow-y-auto text-sm text-foreground"
              disabled={isLoading}
              rows={1}
            />
            </div>
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

