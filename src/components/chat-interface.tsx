"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
}

// Hardcoded example message to avoid errors
const exampleMessage: Message = {
  id: "example-1",
  role: "assistant",
  content: "Hello! I'm your AI assistant. How can I help you today?"
};

export function ChatInterface({
  messages,
  isLoading = false,
}: ChatInterfaceProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {(messages.length === 0 ? [exampleMessage] : messages).map((message) => (
            <div key={message.id} className="flex gap-4">
              {message.role === "user" ? (
                <>
                  <Avatar>
                    {/* <AvatarImage src="/placeholder.svg?height=32&width=32" /> */}
                    <AvatarFallback className="bg-blue-200 dark:bg-blue-900">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-blue-200 dark:bg-blue-900 rounded-lg p-4">
                      <p>{message.content}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Avatar>
                    <AvatarFallback>🤖</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg border p-4">
                      <div className="prose prose-sm dark:prose-invert mb-4 max-w-none text-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                            code: ({ className, children, ...props }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                              ) : (
                                <code className="block bg-muted p-3 rounded-lg overflow-x-auto text-sm" {...props}>{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="ml-4">{children}</li>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-2">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-4">
                                <table className="min-w-full border-collapse border border-border">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                            th: ({ children }) => (
                              <th className="border border-border px-4 py-2 text-left font-semibold bg-zinc-200 dark:bg-zinc-900">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-border px-4 py-2">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500">AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Thinking</span>
                    <div className="flex gap-1">
                      <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"></div>
                      <div
                        className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "0.1s" }}></div>
                      <div
                        className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}