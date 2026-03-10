"use client";

import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelDropdown } from "./model-dropdown";
import { api } from "@/lib/eden-client";
import { DEFAULT_AI_MODEL } from "@/elysia/config/ai-models.config";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorClientProps {
  className?: string;
  onModelChange?: (modelId: string) => void;
  selectedModel?: string;
}

export function ModelSelectorClient({ className, onModelChange, selectedModel = DEFAULT_AI_MODEL }: ModelSelectorClientProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.ai_models.get();
        if (response.data) {
          setModels(response.data.models);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  //  const selectedModelName = models.find(m => m.id === DEFAULT_AI_MODEL)?.name || 'Select Model';

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Bot className="h-4 w-4" />
        <span>Loading models...</span>
      </div>
    );
  }

  return (
    <ModelDropdown
      models={models}
      selectedModel={selectedModel}
      onModelChange={onModelChange}
      className={className}
    />
  );
}
