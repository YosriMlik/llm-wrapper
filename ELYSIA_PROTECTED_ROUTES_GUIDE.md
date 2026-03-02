# Elysia Protected Routes Guide

**Complete guide to creating protected routes using Elysia macros with Better Auth**

This guide shows you how to implement clean, robust authentication for your API routes using the macro pattern.

---

## Table of Contents

1. [Overview](#overview)
2. [One-Time Setup](#one-time-setup)
3. [Creating Protected Routes](#creating-protected-routes)
4. [Common Patterns](#common-patterns)
5. [Testing Protected Routes](#testing-protected-routes)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the Macro Pattern?

The macro pattern allows you to add custom properties to route definitions. In our case, `authenticated: true` automatically:

✅ Validates the session  
✅ Returns 401 if not authenticated  
✅ Provides `user` and `session` in the route context  
✅ Keeps your route handlers clean  

### Architecture

```
authController (defines macro)
    ↓
yourController (imports authController)
    ↓
route definition (uses authenticated: true)
    ↓
automatic auth check happens
    ↓
your handler gets user context
```

---

## One-Time Setup

### Step 1: Create Auth Controller with Macro

This is already done, but here's what it looks like:

```typescript
// elysia/controllers/auth.controller.ts
import { Elysia } from 'elysia'
import { auth } from '../config/better-auth.config'

export const authController = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    authenticated: {
      async resolve({ set, request: { headers } }) {
        try {
          const session = await auth.api.getSession({
            headers
          })

          if (!session?.user) {
            set.status = 401
            return {
              error: 'Unauthorized - Please sign in'
            }
          }

          return {
            user: session.user,
            session: session.session
          }
        } catch (error) {
          console.error('Auth macro error:', error)
          set.status = 401
          return {
            error: 'Authentication failed'
          }
        }
      }
    }
  })

// ... OpenAPI exports
```

### Step 2: Register Services in Main App

Make sure your `app.ts` has the services decorator:

```typescript
// elysia/app.ts
export const app = new Elysia({ prefix: '/api' })
  .decorate('services', {
    aiModels: aiModelsService,
    chat: chatService,
    user: userService
  })
  .use(authController) // ✅ Must be before other controllers
  .use(chatController)
  // ... other controllers
```

---

## Creating Protected Routes

### Basic Pattern

Every time you want to create a protected route, follow this pattern:

#### 1. Import Auth Controller

```typescript
// elysia/controllers/your-controller.ts
import { Elysia, t } from 'elysia'
import { authController } from './auth.controller' // ✅ Import this

export const yourController = new Elysia({ name: 'your-controller' })
  .use(authController) // ✅ Use it first
  .group('/your-prefix', (app) => app
    // Your routes here
  )
```

#### 2. Add Protected Route

```typescript
.post('/protected-endpoint', async ({ body, services, user }: any) => {
  // ✅ user is automatically available
  // ✅ If not authenticated, this handler never runs
  
  // Your logic here
  const result = await services.yourService.doSomething(user.id, body)
  
  return { success: true, result }
}, {
  authenticated: true, // ✅ This makes it protected
  body: t.Object({
    // Your request body schema
  })
})
```

#### 3. Use `any` Type for Context (TypeScript Workaround)

Due to Elysia's type inference limitations with decorators, use `any`:

```typescript
async ({ body, services, user, session }: any) => {
  // All properties are available at runtime
  // TypeScript just doesn't know about them
}
```

---

## Common Patterns

### Pattern 1: User-Specific Data (Most Common)

```typescript
.get('/my-data', async ({ services, user }: any) => {
  const data = await services.yourService.getUserData(user.id)
  return { success: true, data }
}, {
  authenticated: true
})
```

**Use when:** Fetching data that belongs to the authenticated user

---

### Pattern 2: Create Resource for User

```typescript
.post('/create', async ({ body, services, user }: any) => {
  const resource = await services.yourService.create({
    userId: user.id,
    ...body
  })
  return { success: true, resource }
}, {
  authenticated: true,
  body: t.Object({
    name: t.String(),
    description: t.String(),
  })
})
```

**Use when:** Creating a resource that should be owned by the authenticated user

---

### Pattern 3: Update/Delete with Ownership Check

```typescript
.delete('/:id', async ({ params, services, user, set }: any) => {
  try {
    // Service should verify ownership
    await services.yourService.deleteIfOwner(params.id, user.id)
    return { success: true }
  } catch (error) {
    set.status = 403
    return { 
      success: false, 
      error: 'Forbidden - Not your resource' 
    }
  }
}, {
  authenticated: true,
  params: t.Object({
    id: t.String()
  })
})
```

**Use when:** Modifying/deleting resources that must belong to the user

---

### Pattern 4: Role-Based Access

```typescript
.get('/admin-only', async ({ services, user, set }: any) => {
  // Check role manually after authentication
  if (user.role !== 'admin') {
    set.status = 403
    return { error: 'Admin access required' }
  }
  
  const data = await services.yourService.getAdminData()
  return { success: true, data }
}, {
  authenticated: true // ✅ Must be authenticated first
})
```

**Use when:** Restricting access to specific user roles

---

### Pattern 5: Optional Authentication

```typescript
.get('/public-but-personalized', async ({ services, headers }: any) => {
  // Try to get session, but don't require it
  let user = null
  try {
    const session = await auth.api.getSession({ headers })
    user = session?.user
  } catch {}
  
  const data = await services.yourService.getData(user?.id)
  return { success: true, data, personalized: !!user }
}, {
  // ❌ No authenticated: true
  // Route works for both authenticated and anonymous users
})
```

**Use when:** Content is public but can be personalized if user is logged in

---

### Pattern 6: Multiple Protected Routes in Group

```typescript
export const chatController = new Elysia({ name: 'chat-controller' })
  .use(authController)
  .group('/chat', (app) => app
    // Public endpoint
    .post('/', async ({ body, services }: any) => {
      return await services.chat.sendMessage(body)
    }, {
      body: ChatRequestDto
    })
    
    // All history endpoints are protected
    .post('/history', async ({ body, services, user }: any) => {
      const chatId = await services.chat.saveChatHistory(
        user.id,
        body.messages,
        body.model
      )
      return { success: true, chatId }
    }, {
      authenticated: true, // ✅ Protected
      body: t.Object({ /* ... */ })
    })
    
    .get('/history', async ({ services, user }: any) => {
      const chats = await services.chat.getChatHistory(user.id)
      return { success: true, chats }
    }, {
      authenticated: true // ✅ Protected
    })
    
    .get('/history/:id', async ({ params, services, user }: any) => {
      const chat = await services.chat.getChatById(params.id, user.id)
      return { success: true, chat }
    }, {
      authenticated: true, // ✅ Protected
      params: t.Object({ id: t.String() })
    })
  )
```

**Use when:** You have a mix of public and protected endpoints in one controller

---

## Testing Protected Routes

### Manual Testing with cURL

#### 1. Sign in and get session cookie

```bash
# Sign in via Better Auth
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

#### 2. Test protected endpoint with cookie

```bash
# Use the saved cookie
curl http://localhost:3000/api/chat/history \
  -b cookies.txt
```

#### 3. Test without cookie (should return 401)

```bash
curl http://localhost:3000/api/chat/history
# Returns: {"error": "Unauthorized - Please sign in"}
```

### Testing in Client Code

```typescript
// Frontend - Next.js or React
const response = await fetch('/api/chat/history', {
  method: 'GET',
  credentials: 'include', // ✅ Important: sends cookies
  headers: {
    'Content-Type': 'application/json',
  }
})

if (response.status === 401) {
  // Redirect to login
  router.push('/login')
  return
}

const data = await response.json()
```

---

## Complete Controller Template

Use this as a starting point for any new controller:

```typescript
// elysia/controllers/example.controller.ts
import { Elysia, t } from 'elysia'
import { authController } from './auth.controller'

export const exampleController = new Elysia({ name: 'example-controller' })
  .use(authController) // ✅ Always import auth controller
  .group('/example', (app) => app
    
    // Public endpoint - no authentication required
    .get('/public', async ({ services }: any) => {
      const data = await services.example.getPublicData()
      return { success: true, data }
    })
    
    // Protected endpoint - authentication required
    .get('/private', async ({ services, user }: any) => {
      const data = await services.example.getUserData(user.id)
      return { success: true, data }
    }, {
      authenticated: true // ✅ Protected
    })
    
    // Create resource for user
    .post('/', async ({ body, services, user }: any) => {
      const resource = await services.example.create({
        userId: user.id,
        ...body
      })
      return { success: true, resource }
    }, {
      authenticated: true, // ✅ Protected
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      })
    })
    
    // Get specific resource (with ownership check)
    .get('/:id', async ({ params, services, user, set }: any) => {
      try {
        const resource = await services.example.getByIdAndUser(
          params.id, 
          user.id
        )
        return { success: true, resource }
      } catch (error) {
        set.status = 404
        return { success: false, error: 'Not found' }
      }
    }, {
      authenticated: true, // ✅ Protected
      params: t.Object({
        id: t.String()
      })
    })
    
    // Update resource
    .put('/:id', async ({ params, body, services, user, set }: any) => {
      try {
        const resource = await services.example.updateIfOwner(
          params.id,
          user.id,
          body
        )
        return { success: true, resource }
      } catch (error) {
        set.status = 403
        return { success: false, error: 'Forbidden' }
      }
    }, {
      authenticated: true, // ✅ Protected
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      })
    })
    
    // Delete resource
    .delete('/:id', async ({ params, services, user, set }: any) => {
      try {
        await services.example.deleteIfOwner(params.id, user.id)
        return { success: true }
      } catch (error) {
        set.status = 403
        return { success: false, error: 'Forbidden' }
      }
    }, {
      authenticated: true, // ✅ Protected
      params: t.Object({
        id: t.String()
      })
    })
  )
```

---

## Service Layer Pattern

Your services should enforce ownership. Here's the recommended pattern:

```typescript
// elysia/services/example.service.ts
export class ExampleService {
  // Public method - no userId needed
  async getPublicData() {
    return await db.select().from(examples).where(eq(examples.isPublic, true))
  }
  
  // User-specific method - requires userId
  async getUserData(userId: string) {
    if (!userId) throw new Error('User ID required')
    
    return await db
      .select()
      .from(examples)
      .where(eq(examples.userId, userId))
  }
  
  // Create with user ownership
  async create(userId: string, data: CreateExampleDto) {
    if (!userId) throw new Error('User ID required')
    
    const [result] = await db
      .insert(examples)
      .values({
        userId,
        ...data
      })
      .returning()
    
    return result
  }
  
  // Get with ownership check
  async getByIdAndUser(id: string, userId: string) {
    if (!userId) throw new Error('User ID required')
    
    const [result] = await db
      .select()
      .from(examples)
      .where(and(
        eq(examples.id, id),
        eq(examples.userId, userId)
      ))
      .limit(1)
    
    if (!result) {
      throw new Error('Not found or access denied')
    }
    
    return result
  }
  
  // Update with ownership check
  async updateIfOwner(id: string, userId: string, data: UpdateExampleDto) {
    if (!userId) throw new Error('User ID required')
    
    const [result] = await db
      .update(examples)
      .set(data)
      .where(and(
        eq(examples.id, id),
        eq(examples.userId, userId)
      ))
      .returning()
    
    if (!result) {
      throw new Error('Not found or access denied')
    }
    
    return result
  }
  
  // Delete with ownership check
  async deleteIfOwner(id: string, userId: string) {
    if (!userId) throw new Error('User ID required')
    
    const [result] = await db
      .delete(examples)
      .where(and(
        eq(examples.id, id),
        eq(examples.userId, userId)
      ))
      .returning()
    
    if (!result) {
      throw new Error('Not found or access denied')
    }
    
    return true
  }
}
```

---

## Quick Checklist

Every time you create a protected route:

- [ ] Import `authController` at the top of your controller
- [ ] Use `.use(authController)` before defining routes
- [ ] Add `authenticated: true` to route config
- [ ] Use `any` type for context destructuring: `async ({ user, services }: any) => {}`
- [ ] Access `user.id` in your handler (it's guaranteed to exist)
- [ ] Pass `user.id` to service methods
- [ ] Service methods should validate `userId` and check ownership

---

## Troubleshooting

### Error: `Property 'authenticated' does not exist`

**Problem:** TypeScript doesn't recognize the `authenticated` property.

**Solution:** Make sure you imported and used `authController`:

```typescript
import { authController } from './auth.controller'

export const yourController = new Elysia()
  .use(authController) // ✅ Must have this
```

---

### Error: `Property 'user' does not exist`

**Problem:** TypeScript doesn't know about `user` in the context.

**Solution:** Use `any` type for context:

```typescript
// ❌ Wrong
async ({ user }) => { }

// ✅ Correct
async ({ user }: any) => { }
```

---

### Error: `Property 'services' does not exist`

**Problem:** Services decorator not inherited or TypeScript doesn't see it.

**Solution:** Use `any` type AND make sure services are registered in `app.ts`:

```typescript
// app.ts
.decorate('services', { /* ... */ })

// controller.ts
async ({ services }: any) => { }
```

---

### Route returns 401 even when authenticated

**Problem:** Session cookie not being sent or recognized.

**Solutions:**

1. **Frontend:** Make sure to use `credentials: 'include'`:
```typescript
fetch('/api/endpoint', {
  credentials: 'include' // ✅ Sends cookies
})
```

2. **CORS:** Make sure CORS allows credentials:
```typescript
.use(cors({
  credentials: true, // ✅ Allow cookies
  origin: ["http://localhost:3000"]
}))
```

3. **Cookie domain:** Make sure `baseURL` in auth config matches your domain

---

### User object is undefined in handler

**Problem:** Macro didn't run or failed silently.

**Solutions:**

1. Check server logs for auth errors
2. Verify `authenticated: true` is in route config
3. Test auth endpoint directly: `GET /api/auth/session`
4. Check if cookie exists in browser DevTools

---

## Summary

### The Pattern (Repeat for Every Protected Route)

1. **Import auth controller**
```typescript
import { authController } from './auth.controller'
```

2. **Use it in your controller**
```typescript
export const yourController = new Elysia()
  .use(authController)
```

3. **Add to route config**
```typescript
.post('/endpoint', handler, {
  authenticated: true // ✅ This is the magic
})
```

4. **Access user in handler**
```typescript
async ({ user, services }: any) => {
  // user.id is guaranteed to exist
  // If not authenticated, handler never runs
}
```

That's it! This pattern keeps your authentication logic centralized and your route handlers clean. 🎯

---

## Additional Resources

- [Elysia Documentation](https://elysiajs.com)
- [Elysia Macros](https://elysiajs.com/patterns/macro.html)
- [Better Auth Documentation](https://better-auth.com)
- [Better Auth Troubleshooting Guide](./BETTER_AUTH_FIXES.md)

---

**Last Updated:** March 2, 2026
