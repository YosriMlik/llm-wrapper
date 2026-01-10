# Elysia API - Model/Service/Controller Architecture

Clean M/S/C architecture with DTOs integrated in routes for a simple yet organized structure.

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
├── controllers/                # HTTP request/response handling
│   ├── ai-models.controller.ts # AI models route handlers
│   ├── chat.controller.ts     # Chat route handlers
│   └── health.controller.ts   # Health check handlers
├── routes/                     # Elysia routes + DTOs
│   ├── ai-models.routes.ts    # AI models routes + validation
│   ├── chat.routes.ts         # Chat routes + validation
│   └── health.routes.ts       # Health routes + validation
├── config/                     # Configuration
│   └── ai-models.ts           # AI models config & constants
├── app.ts                      # Main Elysia app composition
└── index.ts                    # Export services for server components
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

**Controllers** - HTTP handling
- Request/response mapping
- Error handling
- Calls services, returns DTOs

**Routes** - API definitions + DTOs
- Elysia route definitions
- Embedded DTOs for validation
- API contract enforcement

## Usage Examples

### In API Routes
```typescript
// Automatic validation with DTOs
POST /api/chat -> ChatController.sendMessage -> ChatService.sendMessage
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

- **Clean Separation**: Each layer has clear responsibilities
- **Reusable Services**: Business logic works in API routes and server components
- **Type Safety**: DTOs for API validation, domain models for business logic
- **Simple Structure**: DTOs embedded in routes (no separate DTO folder needed)
- **Scalable**: Easy to add new features following the same pattern

## API Endpoints

- `GET /api/` - Health check
- `GET /api/ai-models` - List available AI models
- `POST /api/chat` - Send chat messages