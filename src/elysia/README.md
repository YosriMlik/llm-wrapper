# Elysia API - Service/Controller Architecture with Better Auth & Dependency Injection

Clean Service/Controller architecture with Better Auth integration and Elysia dependency injection using official patterns.

## Architecture (Updated with DI Pattern)

```
src/elysia/
├── dtos/                      # NEW: Separate DTO definitions
│   ├── ai-models.dto.ts      # AI models DTOs
│   ├── chat.dto.ts           # Chat DTOs
│   └── health.dto.ts         # Health DTOs
├── config/
│   └── auth.ts               # Better Auth configuration
├── models/                   # Domain models (business entities)
│   ├── ai-model.ts          # AI model domain types
│   ├── chat.ts              # Chat domain types
│   └── user.ts              # User domain types
├── services/                 # Business logic (instance-based for DI)
│   ├── ai-models.service.ts # AI models business logic
│   ├── chat.service.ts      # Chat business logic
│   └── auth.service.ts      # Auth business logic
├── middleware/               # Auth middleware with macros
│   ├── auth.middleware.ts   # Better Auth macros
│   └── logging.middleware.ts # NEW: Request logging
├── controllers/              # Routes + Handlers (DTOs moved to dtos/)
│   ├── ai-models.controller.ts # AI models routes
│   ├── chat.controller.ts     # Chat routes (protected)
│   └── health.controller.ts   # Health routes
├── app.ts                    # Main Elysia app with DI setup
└── index.ts                  # Export services for server components
```

## Dependency Injection Pattern (NEW)

### Service Registration

```typescript
// src/elysia/app.ts
import { AiModelsService } from './services/ai-models.service'
import { AuthService } from './services/auth.service'
import { ChatService } from './services/chat.service'

const aiModelsService = new AiModelsService()
const authService = new AuthService()
const chatService = new ChatService()

export const app = new Elysia({ prefix: '/api' })
  // Dependency Injection setup
  .decorate('services', {
    aiModels: aiModelsService,
    auth: authService,
    chat: chatService
  })
  .use(aiModelsController)
  .use(chatController)
```

### Service Usage in Controllers

```typescript
// src/elysia/controllers/ai-models.controller.ts
const getAiModels = (context: any) => {
  const { services, user } = context

  // Use injected services
  if (user && !services.auth.canAccessAiModels(user)) {
    throw new Error('Access denied')
  }

  const config = services.aiModels.getAiModels()
  return { models: config.models, default: config.defaultModel }
}
```

### Service Conversion (Static → Instance)

**Before:**
```typescript
export class AiModelsService {
  static getAiModels() { /* ... */ }
}
```

**After:**
```typescript
export class AiModelsService {
  getAiModels() { /* ... */ } // Instance method
}
```

## Better Auth Integration

### Official Elysia Pattern
```typescript
// Better Auth macro middleware
export const betterAuth = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        if (!session) return status(401)
        return { user: session.user, session: session.session }
      },
    },
  })
```

### Auth Features

**Built-in Better Auth Endpoints:**
- `POST /api/auth/sign-up/email` - Create account
- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

**Custom Protected Routes:**
- Chat endpoints require authentication (`auth: true`)
- AI models are optionally authenticated (`optionalAuth: true`)

**Middleware Types:**
- `betterAuth` - Require authentication (throws 401 if not authenticated)
- `optionalAuth` - Optional authentication (user can be null)
- `requireRole(role)` - Require specific role

## Usage Examples

### Client-side (React)
```typescript
import { signIn, signUp, useSession } from '@/lib/auth-client'

function LoginForm() {
  const { data: session } = useSession()

  const handleSignIn = async () => {
    await signIn.email({
      email: "user@example.com",
      password: "password123"
    })
  }
}
```

### Server Components
```typescript
import { AuthService, AiModelsService } from '@/elysia'

export default async function ProtectedPage({ headers }) {
  const session = await AuthService.getSession(headers)
  if (!session) redirect('/login')

  const models = new AiModelsService().getAiModels()
  return <div>Welcome {session.user.email}</div>
}
```

### API Usage
```bash
# Sign up
curl -X POST /api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John"}'

# Use protected chat endpoint
curl -X POST /api/chat \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install better-auth better-sqlite3 @elysiajs/cors
```

### 2. Environment Variables
```env
BETTER_AUTH_SECRET=your-32-char-secret-key
BETTER_AUTH_URL=http://localhost:3000
OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Generate Database Schema
```bash
npx @better-auth/cli generate
npx @better-auth/cli migrate
```

### 4. Start Development
```bash
npm run dev
```

## API Endpoints

**Public:**
- `GET /api/` - Health check
- `GET /api/ai-models` - List AI models (optional auth)

**Authentication (Better Auth):**
- `POST /api/auth/sign-up/email` - Sign up
- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get session

**Protected:**
- `POST /api/chat` - Send chat messages (requires auth)

## Benefits

- **Official Integration**: Uses Better Auth's recommended Elysia pattern
- **Dependency Injection**: Enterprise-grade DI with Elysia decorators
- **Automatic Auth Endpoints**: Better Auth provides all auth routes
- **Macro-based Protection**: Clean, declarative route protection
- **Reusable Services**: Business logic works in API routes and server components
- **Type Safety**: Full TypeScript + Better Auth type inference
- **CORS Support**: Proper CORS configuration for auth
- **Role-based Access**: Built-in role system with custom business logic
- **Production Logging**: Comprehensive logging middleware included
- **Proper Error Handling**: JSON error responses for all auth failures
- **Request Tracking**: Full request/response lifecycle logging
- **Performance Monitoring**: Built-in timing for all API calls

## Migration Notes

### From Static to DI Pattern
1. Move DTOs to `dtos/` folder
2. Convert services to instance methods
3. Update controllers to use injected services
4. Add service registration in `app.ts`
5. Update imports to use new structure

### Compatibility
- ✅ Fully backward compatible
- ✅ Works with existing React server components
- ✅ Maintains all existing functionality
- ✅ Easy to extend with new services
