# Authentication Integration Guide: Next.js + Elysia + Better Auth

## Overview

You have a hybrid setup with:
- **Next.js** (frontend) - React components, pages, UI
- **Elysia** (backend API) - REST endpoints, business logic
- **Better Auth** - Authentication system with Neon database

## Recommended Approach: Next.js Integration

Since you're using Next.js for the frontend, I recommend following the **Next.js integration** approach for Better Auth. Here's why:

1. **Frontend Authentication**: Next.js handles the UI, forms, and user interactions
2. **API Layer**: Elysia serves as your API layer that Better Auth can authenticate
3. **Session Management**: Better Auth's Next.js integration handles cookies and sessions properly

## Implementation Strategy

### 1. Frontend (Next.js) - Authentication UI

Create authentication components in your Next.js app:

```tsx
// src/components/auth/SignIn.tsx
"use client";

import { signIn, signOut, useSession } from "better-auth/react";

export function SignIn() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => signIn()}>Sign In</button>
    </div>
  );
}
```

### 2. API Routes (Next.js) - Authentication Endpoints

Create Next.js API routes for authentication:

```typescript
// src/app/api/auth/[...auth]/route.ts
import { auth } from "@/elysia/config/auth.config";

export const GET = auth.handler;
export const POST = auth.handler;
```

### 3. Elysia API - Protected Endpoints

Use Elysia middleware to protect your API endpoints:

```typescript
// src/elysia/middleware/auth.middleware.ts
import { auth } from '../config/auth.config';

export const authMiddleware = async (context: any) => {
  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add user to context
    context.user = session.user;
    return context.next();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### 4. Protected Elysia Routes

Apply the auth middleware to your Elysia routes:

```typescript
// src/elysia/controllers/chat.controller.ts
import { authMiddleware } from '../middleware/auth.middleware';

export const chatController = new Elysia({ prefix: '/chat' })
  .use(authMiddleware)
  .post('/', async ({ body, user }) => {
    // Only authenticated users can access this
    return await chatService.sendMessage(body);
  });
```

## Alternative: Elysia-Only Authentication

If you prefer to handle everything in Elysia:

```typescript
// src/elysia/config/auth.config.ts (Elysia version)
import { betterAuth } from "better-auth";
import { Elysia } from "elysia";

export const authPlugin = new Elysia()
  .use(betterAuth({
    // Your auth config
  }))
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return { session };
  });

// In your routes
app.use(authPlugin)
  .get('/protected', ({ session }) => {
    if (!session) {
      throw new Error('Unauthorized');
    }
    return { message: 'Protected data' };
  });
```

## Recommended: Hybrid Approach

I recommend the **Next.js integration** approach because:

1. **Better UX**: Next.js handles authentication flows naturally
2. **Session Management**: Cookies work seamlessly with Next.js
3. **API Protection**: Elysia can validate sessions from Better Auth
4. **Flexibility**: You can call Elysia APIs from Next.js with proper auth

## Next Steps

1. **Set up Next.js auth routes** (API routes for auth)
2. **Create auth components** in your Next.js frontend
3. **Add auth middleware** to Elysia for API protection
4. **Test the integration** by creating a simple protected route

Would you like me to help implement any of these approaches?