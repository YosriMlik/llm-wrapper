# AI Chatbot

A modern AI chatbot built with Next.js and OpenRouter API. Chat with multiple AI models through a clean, responsive interface.

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/YosriMlik/llm-wrapper
   cd llm_wrapper
   npm install
   ```

2. **Add your API key**
   Create a `.env.local` file:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Get API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

## Tech Stack

- **Next.js 16** - React framework with App Router for optimal performance
- **Elysia** - Ultra-fast TypeScript web framework for API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **OpenRouter API** - Access to multiple AI models

# Elysia API - Service/Controller Architecture

Clean Service/Controller architecture with merged routes, DTOs, and handlers for simplicity.

## Architecture

```
src/elysia/
├── models/                     # Domain models (business entities)
│   ├── ai-model.ts            # AI model domain types
│   └── chat.ts                # Chat domain types
├── services/                   # Business logic (reusable in server components)
│   ├── ai-models.service.ts   # AI models business logic
│   ├── chat.service.ts        # Chat business logic
│   └── openrouter.ts          # External API service
├── controllers/                # Routes + DTOs + Handlers (all-in-one)
│   ├── ai-models.controller.ts # AI models: DTOs + handlers + routes
│   ├── chat.controller.ts     # Chat: DTOs + handlers + routes
│   └── health.controller.ts   # Health: DTOs + handlers + routes
├── config/                     # Configuration
│   └── ai-models.ts           # AI models config & constants
├── app.ts                      # Main Elysia app composition
└── index.ts                    # Export services for server components
```

## Controller Structure

Each controller contains:
- **DTOs** - Elysia validation schemas
- **Handlers** - Business logic functions
- **Routes** - Elysia route definitions

```typescript
// Example: ai-models.controller.ts
import { Elysia, t } from 'elysia'
import { AiModelsService } from '../services/ai-models.service'

// DTOs
const AiModelDto = t.Object({
  id: t.String(),
  name: t.String(),
})

// Handlers
const getAiModels = async () => {
  const config = AiModelsService.getAiModels()
  return { models: [...], default: "..." }
}

// Routes
export const aiModelsController = new Elysia()
  .get('/ai-models', getAiModels, {
    response: GetAiModelsResponseDto,
  })
```

## Layer Responsibilities

**Models** - Domain entities and business types
- Pure TypeScript interfaces
- Used by services and server components
- No API concerns

**Services** - Business logic (reusable everywhere)
- Core business operations
- Can be imported in server components
- Domain model focused

**Controllers** - Complete API feature (DTOs + Handlers + Routes)
- Request/response validation (DTOs)
- HTTP handling (handlers)
- Route definitions (Elysia routes)
- Single file per feature

## Usage Examples

### In API Routes
```typescript
// Automatic validation with DTOs
POST /api/chat → sendMessage handler → ChatService.sendMessage
```

### In Server Components
```typescript
import { AiModelsService, ChatService } from '@/elysia'

export default function MyPage() {
  const models = AiModelsService.getAiModels() // Domain models
  const response = await ChatService.sendMessage({ message: "Hello" })
  return <div>...</div>
}
```

## Benefits

- **Simplified Structure**: Everything for a feature in one controller file
- **Reusable Services**: Business logic works in API routes and server components
- **Type Safety**: DTOs for API validation, domain models for business logic
- **Easy Navigation**: Find all feature code in one place
- **Scalable**: Easy to add new features following the same pattern

## API Endpoints

- `GET /api/` - Health check
- `GET /api/ai-models` - List available AI models
- `POST /api/chat` - Send chat messages

## Available Models

- Mistral Devstral (default)
- Nvidia Nemotron Nano
- OpenAI OSS 120B
- Xiaomi Mimo Flash

All models are free tier from OpenRouter.
