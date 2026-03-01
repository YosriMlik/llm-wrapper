# Google OAuth Setup Guide

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Set **Authorized JavaScript origins**: `http://localhost:3000`
7. Set **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
8. Click **Create**
9. Copy your **Client ID** and **Client Secret**

## Step 2: Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Your existing variables
OPENROUTER_API_KEY=
BETTER_AUTH_SECRET=
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=
```

## Step 3: Update Better Auth Configuration

Update your auth config to include Google OAuth:

```typescript
// src/elysia/config/auth.config.ts
import { betterAuth } from "better-auth"
import { Pool } from "@neondatabase/serverless"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "../../lib/schema"

// Create Neon connection pool for better-auth
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool, { schema })

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
```

## Step 4: Create Chat History Schema

Add chat history to your database schema:

```typescript
// src/lib/schema.ts (add to existing file)
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core"

// ... existing tables ...

// Chat history table
export const chatHistory = pgTable("chat_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: text("messages").notNull(), // JSON string of messages
  model: text("model").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
```

## Step 5: Update Drizzle Config

Make sure your drizzle config includes the new table:

```typescript
// drizzle.config.ts (no changes needed, it will auto-detect)
```

## Step 6: Generate and Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

## Step 7: Create Chat Service with History

```typescript
// src/elysia/services/chat.service.ts
import { createOpenRouterService } from './openrouter'
import { DEFAULT_AI_MODEL } from '../config/ai-models.config'
import { db } from '../../lib/db'
import { chatHistory } from '../../lib/schema'
import { eq } from 'drizzle-orm'
import type { ChatMessage, ChatRequest, ChatResponse } from '../models/chat'

export class ChatService {
  async sendMessage(request: ChatRequest, userId?: string): Promise<ChatResponse> {
    const { message, messages, model } = request

    // Validate message
    if (!message && (!messages || messages.length === 0)) {
      throw new Error('Message or messages array is required')
    }

    // Create OpenRouter service
    const openRouterService = createOpenRouterService()
    if (!openRouterService) {
      throw new Error('OpenRouter API key not configured')
    }

    // Use provided model or default
    const selectedModel = model || DEFAULT_AI_MODEL

    // Build messages array
    let chatMessages: ChatMessage[]
    if (messages && Array.isArray(messages) && messages.length > 0) {
      chatMessages = messages
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }]
    } else {
      throw new Error('Message or messages array is required')
    }

    try {
      const response = await openRouterService.chat(selectedModel, chatMessages)

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from AI model')
      }

      const aiResponse = response.choices[0].message.content

      // Save to history if user is authenticated
      if (userId) {
        await this.saveChatHistory(userId, chatMessages, aiResponse, selectedModel)
      }

      return {
        response: aiResponse,
        model: response.model || selectedModel,
      }
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response')
    }
  }

  private async saveChatHistory(
    userId: string,
    userMessages: ChatMessage[],
    aiResponse: string,
    model: string
  ) {
    try {
      // Create title from first user message
      const title = userMessages[0]?.content?.slice(0, 50) || 'New Chat'

      // Add AI response to messages
      const allMessages = [...userMessages, { role: 'assistant', content: aiResponse }]

      await db.insert(chatHistory).values({
        userId,
        title,
        messages: JSON.stringify(allMessages),
        model,
      })
    } catch (error) {
      console.error('Failed to save chat history:', error)
      // Don't throw error, just log it - chat should still work
    }
  }

  async getChatHistory(userId: string) {
    try {
      const chats = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, userId))
        .orderBy(chatHistory.updatedAt)

      return chats.map(chat => ({
        ...chat,
        messages: JSON.parse(chat.messages) as ChatMessage[],
      }))
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return []
    }
  }

  async getChatById(chatId: string, userId: string) {
    try {
      const chat = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.id, chatId))
        .where(eq(chatHistory.userId, userId))
        .limit(1)

      if (!chat.length) {
        throw new Error('Chat not found')
      }

      return {
        ...chat[0],
        messages: JSON.parse(chat[0].messages) as ChatMessage[],
      }
    } catch (error) {
      console.error('Failed to get chat:', error)
      throw error
    }
  }
}
```

## Step 8: Create Authentication Components

Since we're using Elysia for the backend, we'll create simple fetch-based authentication components:

```tsx
// src/components/auth/AuthButton.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, LogOut, LogIn } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error("Failed to check auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    window.location.href = "/api/auth/google"
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include"
      })
      setUser(null)
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          <span>{user.name || user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      Sign In with Google
    </Button>
  )
}
```

## Step 9: Update Chat Interface

```tsx
// src/components/chat-interface.tsx
"use client"

import { useState, useEffect } from "react"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { Sidebar } from "./sidebar"
import { useSession } from "better-auth/react"
import { ChatService } from "@/elysia/services/chat.service"
import type { ChatMessage } from "@/elysia/models/chat"

export function AiChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const chatService = new ChatService()

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          messages: [...messages, userMessage],
          userId: session?.user?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response,
        }])
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Sorry, I'm having trouble responding right now. Please try again.",
        }])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        chats={[]}
        selectedChatId={null}
        onNewChat={() => setMessages([])}
        onSelectChat={() => {}}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={!isSidebarOpen}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <div className="flex items-center gap-4">
            <AuthButton />
            <Button
              variant="outline"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? "Hide" : "Show"} History
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatMessages messages={messages} />
        </div>

        {/* Input */}
        <ChatInput
          input=""
          handleInputChange={() => {}}
          handleSubmit={(e) => {
            e.preventDefault()
            const input = e.currentTarget.querySelector('input')?.value || ''
            handleSendMessage(input)
          }}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
```

## Step 10: Create Elysia Authentication Controller

Better Auth automatically provides authentication routes. Create an Elysia controller for auth:

```typescript
// src/elysia/controllers/auth.controller.ts
import { Elysia } from 'elysia'
import { auth } from '../config/auth.config'

export const authController = new Elysia({ prefix: '/auth' })
  // Better Auth provides all auth routes automatically
  .all('/*', async ({ request }) => {
    return auth.handler(request)
  })
```

## Step 11: Update Elysia App

Add the auth controller to your main Elysia app:

```typescript
// src/elysia/app.ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { healthController } from './controllers/health.controller'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'
import { authController } from './controllers/auth.controller'
import { AiModelsService } from './services/ai-models.service'
import { AuthService } from './services/auth.service'
import { ChatService } from './services/chat.service'

// Create service instances for dependency injection
const aiModelsService = new AiModelsService()
const authService = new AuthService()
const chatService = new ChatService()

export const app = new Elysia({ prefix: '/api' })
  // Set up dependency injection with decorators
  .decorate('services', {
    aiModels: aiModelsService,
    // auth: authService,
    chat: chatService
  })
  .use(cors({
    origin: "*", // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(authController) // Add auth routes
  .use(healthController)
  .use(aiModelsController)
  .use(chatController)
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ?
                        error.message :
                        typeof error === 'string' ? error :
                        'Unknown error'

    console.error('Elysia Error:', { code, error: errorMessage })

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Route not found' }
    }

    set.status = 500
    return { error: errorMessage }
  })
```

## Step 12: Update Chat Controller

Update your chat controller to work with the new setup:

```typescript
// src/elysia/controllers/chat.controller.ts
import { Elysia } from 'elysia'
import { ChatService } from '../services/chat.service'
import { auth } from '../config/auth.config'

export const chatController = new Elysia({ prefix: '/chat' })
  .post('/', async ({ body, request }) => {
    try {
      // Get session from request
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      const { message, messages, model } = body
      const chatService = new ChatService()

      // Send message (works with or without auth)
      const response = await chatService.sendMessage(
        { message, messages, model },
        session?.user?.id // Pass userId if authenticated
      )

      return {
        success: true,
        data: response
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  })
  
  // Get chat history (protected route)
  .get('/history', async ({ request }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      const chatService = new ChatService()
      const history = await chatService.getChatHistory(session.user.id)

      return {
        success: true,
        data: history
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat history'
      }
    }
  })
  
  // Get specific chat (protected route)
  .get('/:id', async ({ params, request }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      const chatService = new ChatService()
      const chat = await chatService.getChatById(params.id, session.user.id)

      return {
        success: true,
        data: chat
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat'
      }
    }
  })
```

## Summary

This setup provides:

✅ **Optional Authentication**: App works without auth, but saves history when logged in
✅ **Google OAuth**: Easy sign-in with Google accounts
✅ **Chat History**: Saves conversations per user when authenticated
✅ **Secure**: Uses Better Auth for session management
✅ **Flexible**: Works for both authenticated and anonymous users

The key is that the chat functionality works for everyone, but authenticated users get the benefit of persistent chat history.
  })
```

## Step 11: Update Elysia App

Add the auth controller to your main Elysia app:

```typescript
// src/elysia/app.ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { healthController } from './controllers/health.controller'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'
import { authController } from './controllers/auth.controller'
import { AiModelsService } from './services/ai-models.service'
import { AuthService } from './services/auth.service'
import { ChatService } from './services/chat.service'

// Create service instances for dependency injection
const aiModelsService = new AiModelsService()
const authService = new AuthService()
const chatService = new ChatService()

export const app = new Elysia({ prefix: '/api' })
  // Set up dependency injection with decorators
  .decorate('services', {
    aiModels: aiModelsService,
    // auth: authService,
    chat: chatService
  })
  .use(cors({
    origin: "*", // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(authController) // Add auth routes
  .use(healthController)
  .use(aiModelsController)
  .use(chatController)
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ?
                        error.message :
                        typeof error === 'string' ? error :
                        'Unknown error'

    console.error('Elysia Error:', { code, error: errorMessage })

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Route not found' }
    }

    set.status = 500
    return { error: errorMessage }
  })
```

## Step 12: Update Chat Controller

Update your chat controller to work with the new setup:

```typescript
// src/elysia/controllers/chat.controller.ts
import { Elysia } from 'elysia'
import { ChatService } from '../services/chat.service'
import { auth } from '../config/auth.config'

export const chatController = new Elysia({ prefix: '/chat' })
  .post('/', async ({ body, request }) => {
    try {
      // Get session from request
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      const { message, messages, model } = body
      const chatService = new ChatService()

      // Send message (works with or without auth)
      const response = await chatService.sendMessage(
        { message, messages, model },
        session?.user?.id // Pass userId if authenticated
      )

      return {
        success: true,
        data: response
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  })
  
  // Get chat history (protected route)
  .get('/history', async ({ request }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      const chatService = new ChatService()
      const history = await chatService.getChatHistory(session.user.id)

      return {
        success: true,
        data: history
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat history'
      }
    }
  })
  
  // Get specific chat (protected route)
  .get('/:id', async ({ params, request }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      const chatService = new ChatService()
      const chat = await chatService.getChatById(params.id, session.user.id)

      return {
        success: true,
        data: chat
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat'
      }
    }
  })
```
