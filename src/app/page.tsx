import { ChatInterface } from "@/components/chat-interface";
import { DEFAULT_AI_MODEL } from "@/elysia/config/ai-models.config";

export default function Home() {
  return (
    <ChatInterface selectedModel={DEFAULT_AI_MODEL} />
  );
}