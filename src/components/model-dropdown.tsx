"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
}

interface ModelDropdownProps {
  models: Model[];
  selectedModel: string;
  onModelChange?: (modelId: string) => void;
  className?: string;
}

export function ModelDropdown({ models, selectedModel, onModelChange, className }: ModelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelName = models.find(m => m.id === selectedModel)?.name || 'Select Model';

  const handleModelSelect = (modelId: string) => {
    // Call the onModelChange callback if provided
    if (onModelChange) {
      onModelChange(modelId);
    }
    console.log('Selected model:', modelId);
    setIsOpen(false);
  };

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
                  onClick={() => handleModelSelect(model.id)}
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
