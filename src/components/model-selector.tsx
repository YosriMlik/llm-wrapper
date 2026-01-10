"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/ai-models');
        const data = await response.json();
        setModels(data.models || []);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const selectedModelName = models.find(m => m.id === selectedModel)?.name || 'Select Model';

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Bot className="h-4 w-4" />
        <span>Loading models...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm"
      >
        <Bot className="h-4 w-4" />
        <span className="max-w-[150px] truncate">{selectedModelName}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 z-20 mt-1 w-64 rounded-md border bg-popover p-1 shadow-md">
            <div className="space-y-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    selectedModel === model.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">Free tier</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}