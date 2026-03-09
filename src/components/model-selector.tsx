import { Suspense } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelDropdown } from "./model-dropdown";
import { AiModelsService } from "@/elysia/services/ai-models.service";
import { DEFAULT_AI_MODEL } from "@/elysia/config/ai-models.config";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  className?: string;
  onModelChange?: (modelId: string) => void;
  selectedModel?: string;
}

async function ModelSelectorContent({ onModelChange, selectedModel = DEFAULT_AI_MODEL }: ModelSelectorProps) {
  // Artificial delay to demonstrate PPR streaming
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const service = new AiModelsService();
  const config = service.getAiModels();
  const models = config.models;

  return (
    <ModelDropdown
      models={models}
      selectedModel={selectedModel}
      onModelChange={onModelChange}
      className=""
    />
  );
}

export function ModelSelector({ className, onModelChange, selectedModel = DEFAULT_AI_MODEL }: ModelSelectorProps) {
  return (
    <Suspense 
      fallback={
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
          <Bot className="h-4 w-4" />
          <span>Loading models...</span>
        </div>
      }
    >
      <ModelSelectorContent onModelChange={onModelChange} selectedModel={selectedModel} />
    </Suspense>
  );
}
