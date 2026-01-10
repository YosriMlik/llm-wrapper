# Elysia API Structure

This is an organized Elysia-based API for LLM interactions through OpenRouter.

## Structure

```
src/lib/elysia/
├── app.ts              # Main Elysia app with all routes
├── schemas.ts          # Elysia validation schemas
└── routes/
    ├── health.ts       # Health check endpoint
    ├── models.ts       # Models listing endpoint
    └── chat.ts         # Chat endpoint
```

## Supporting Files

```
src/lib/
├── types/api.ts        # TypeScript interfaces
├── config/models.ts    # Model configuration
└── services/openrouter.ts # OpenRouter API client
```

## Endpoints

- `GET /api/` - Health check
- `GET /api/models` - List available models
- `POST /api/chat` - Chat with AI models

## Benefits

- **Modular Routes** - Each endpoint in its own file
- **Type Safety** - Elysia schemas + TypeScript interfaces
- **Reusable Services** - OpenRouter client can be used anywhere
- **Clean Organization** - Logical file structure
- **Elysia Native** - Uses Elysia's plugin system properly

## Usage

The main app is composed in `app.ts` and exported through the Next.js catch-all route at `src/app/api/[[...slugs]]/route.ts`.