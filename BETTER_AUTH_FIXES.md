# Better Auth Troubleshooting Guide

**Complete guide to fixing common Better Auth issues with Elysia backend + Next.js frontend**

Date: March 2, 2026  
Stack: Elysia + Next.js + Better Auth + Drizzle ORM + Neon PostgreSQL

---

## Table of Contents

1. [Session Cookie Not Working in Production (401 Errors)](#1-session-cookie-not-working-in-production-401-errors)
2. [auth.api.getSession() Returns Null in Server Components](#2-authapigetsession-returns-null-in-server-components)
3. [Cookie Name Mismatch: __Secure- Prefix](#3-cookie-name-mismatch-__secure--prefix)
4. [CORS Issues with Google OAuth](#4-cors-issues-with-google-oauth)
5. [Google Profile Images 429 Rate Limited](#5-google-profile-images-429-rate-limited)
6. [Environment Variables Not Working on Vercel](#6-environment-variables-not-working-on-vercel)

---

## 1. Session Cookie Not Working in Production (401 Errors)

### Problem
- Authentication works locally (`http://localhost:3000`)
- Production returns 401 "Unauthorized" even after successful login
- Session cookie exists but isn't recognized

### Root Cause
**Incorrect `baseURL` configuration** - Backend auth config was using `NEXT_PUBLIC_BETTER_AUTH_URL` instead of `BETTER_AUTH_URL`.

### Solution

#### Update Backend Auth Config
```typescript
// elysia/config/better-auth.config.ts
export const auth = betterAuth({
  // ... other config
  
  // ❌ WRONG - Don't use NEXT_PUBLIC_ in backend
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  
  // ✅ CORRECT - Use server-side env var
  baseURL: process.env.BETTER_AUTH_URL!,
})
```

#### Environment Variables Setup

**Vercel Environment Variables:**
```env
# Server-side only (backend)
BETTER_AUTH_URL=https://your-app.vercel.app
BETTER_AUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
DATABASE_URL=your-neon-db-url

# Client-side (frontend)
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.vercel.app
```

**Local Development (.env.local):**
```env
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret
DATABASE_URL=your-db-url
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
```

#### Update Session Config
```typescript
// elysia/config/better-auth.config.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5,
  },
  cookieAttributes: {
    secure: true, // Required for HTTPS in production
    sameSite: 'lax',
    path: '/',
  }
}
```

### Commit Message
```
fix(auth): use correct baseURL env var in backend config

Changed from NEXT_PUBLIC_BETTER_AUTH_URL to BETTER_AUTH_URL
in backend auth config to fix 401 errors in production.
NEXT_PUBLIC_ vars are for client-side only.
```

---

## 2. auth.api.getSession() Returns Null in Server Components

### Problem
- Cookie exists with session data: `better-auth.session_data=eyJzZXNzaW9u...`
- `auth.api.getSession()` returns `null`
- Works in Elysia API routes but not Next.js Server Components

### Root Cause
**Session storage mode mismatch** - Better Auth with `cookieCache.enabled` stores full session in `better-auth.session_data` cookie (stateless mode), but `auth.api.getSession()` expects `better-auth.session_token` (database lookup mode).

### Solution

#### Create Server Session Helper
```typescript
// lib/auth-server.ts
import { headers } from "next/headers"

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`))
  
  return match ? match.split('=')[1] : null
}

function decodeSessionData(value: string) {
  try {
    const decoded = decodeURIComponent(value)
    const normalized = decoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '==='.slice((normalized.length + 3) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to decode session data:', error)
    return null
  }
}

export async function getServerSession() {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie") || ""
    
    // Get session data cookie
    const sessionDataCookie = getCookieValue(cookieHeader, 'better-auth.session_data')
    
    if (!sessionDataCookie) {
      return null
    }

    // Decode the session data
    const sessionData = decodeSessionData(sessionDataCookie)
    
    if (!sessionData?.session) {
      return null
    }

    return {
      user: sessionData.session.user,
      session: sessionData.session.session
    }
  } catch (error) {
    console.error("Failed to get server session:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session?.user) {
    throw new Error("Authentication required")
  }
  
  return session
}
```

#### Usage in Server Components
```typescript
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  )
}
```

### Why This Works
- **cookieCache enabled** → Full session stored in cookie (no DB lookup needed)
- **Manual decoding** → Read session directly from cookie
- **Faster** → No database query on every request
- **Works everywhere** → Consistent across all environments

### Alternative Solution (Not Recommended)
Disable cookie cache to use token mode:
```typescript
session: {
  cookieCache: {
    enabled: false, // ← This forces session_token mode
  }
}
```
**Downside:** Requires database lookup on every request (slower).

### Commit Message
```
feat(auth): add server session helper for Next.js Server Components

Created getServerSession() helper that decodes better-auth.session_data
cookie directly instead of using auth.api.getSession(). This fixes null
returns in Server Components when cookieCache is enabled.
```

---

## 3. Cookie Name Mismatch: __Secure- Prefix

### Problem
- Production cookies: `__Secure-better-auth.session_data`
- Local cookies: `better-auth.session_data`
- Manual cookie parsing fails in production

### Root Cause
**Secure cookies get `__Secure-` prefix** - When `secure: true` is set (production/HTTPS), browsers automatically add the `__Secure-` prefix to cookie names.

### Solution

#### Update Cookie Parsing to Handle Both
```typescript
const getCookieValue = (cookieHeader: string, name: string) => {
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    // Check for both secure and non-secure cookie names
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1)
    }
    if (trimmed.startsWith(`__Secure-${name}=`)) {
      return trimmed.slice(`__Secure-${name}=`.length)
    }
  }
  return null
}

const getUserIdFromSessionDataCookie = (cookieHeader: string) => {
  // Works for both formats
  const raw = getCookieValue(cookieHeader, 'better-auth.session_data')
  
  if (!raw) return null
  
  try {
    const data = decodeSessionData(raw)
    return data?.session?.user?.id ?? null
  } catch (err) {
    console.error('Failed to get userId from session data:', err)
    return null
  }
}
```

#### Better Auth Config
```typescript
session: {
  cookieAttributes: {
    secure: process.env.NODE_ENV === 'production', // Only secure in prod
    sameSite: 'lax',
    path: '/',
  }
}
```

### Commit Message
```
fix(auth): handle __Secure- cookie prefix in production

Updated cookie parsing to support both normal and __Secure- prefixed
cookie names. Secure cookies get automatic prefix in production (HTTPS).
```

---

## 4. CORS Issues with Google OAuth

### Problem
```
Access to fetch at 'http://localhost:3000/api/auth/sign-in/social' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

### Root Cause
**Frontend deployed on Vercel, backend running locally** - Can't call localhost from production deployment.

### Solution

#### For Production - Deploy Backend
Deploy your Elysia backend to:
- Railway
- Render
- Fly.io
- Vercel (if compatible)

#### Update CORS Config
```typescript
// elysia/app.ts
.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://your-app.vercel.app", // Add Vercel URL
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposeHeaders: ["Set-Cookie"],
}))
```

#### Update Google OAuth Redirect URIs
In Google Cloud Console:
```
Authorized redirect URIs:
- https://your-app.vercel.app/api/auth/callback/google
- http://localhost:3000/api/auth/callback/google

Authorized JavaScript origins:
- https://your-app.vercel.app
- http://localhost:3000
```

### For Local Development
Run both frontend and backend locally:
```bash
# Terminal 1: Backend
bun run dev

# Terminal 2: Frontend
cd frontend && bun run dev
```

### Commit Message
```
fix(cors): add production URL to CORS whitelist and update OAuth

Added Vercel deployment URL to CORS origins and updated Google OAuth
redirect URIs to support both local development and production.
```

---

## 5. Google Profile Images 429 Rate Limited

### Problem
- User profile images return 429 (Too Many Requests)
- Direct Google CDN URLs: `https://lh3.googleusercontent.com/a/...`

### Root Cause
**Google rate limits direct hotlinking** of profile images when accessed without proper referrer or too frequently.

### Solution 1: Add Referrer Policy (Quick Fix)
```typescript
<img
  src={user.image}
  alt={user.name}
  referrerPolicy="no-referrer"
  onError={(e) => {
    e.currentTarget.src = "/default-avatar.png"
  }}
/>
```

### Solution 2: Store Images Locally (Recommended for Production)
```typescript
// elysia/utils/image-storage.ts
import { writeFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function downloadAndStoreImage(imageUrl: string, userId: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error("Failed to fetch image")
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const filename = `${userId}-${randomUUID()}.${ext}`
    
    // Store in public directory
    const publicPath = join(process.cwd(), "public", "avatars", filename)
    await writeFile(publicPath, buffer)
    
    return `/avatars/${filename}`
  } catch (error) {
    console.error("Image storage error:", error)
    return "/default-avatar.png"
  }
}
```

#### Update Better Auth Config
```typescript
export const auth = betterAuth({
  // ... existing config
  
  callbacks: {
    async user(user, account) {
      // Download and store image on first login
      if (account?.providerId === "google" && user.image) {
        const localImagePath = await downloadAndStoreImage(user.image, user.id)
        return {
          ...user,
          image: localImagePath
        }
      }
      return user
    }
  },
})
```

### Commit Message
```
fix(auth): download and store Google profile images locally

Store user profile images in /public/avatars on first login to avoid
Google CDN rate limits. Falls back to default avatar if download fails.
```

---

## 6. Environment Variables Not Working on Vercel

### Problem
- `process.env.BETTER_AUTH_URL` returns `undefined` in client components
- Works locally but not on Vercel

### Root Cause
**Client-side code can't access server-only environment variables** - Vercel (Next.js) requires `NEXT_PUBLIC_` prefix for variables accessible in browser.

### Solution

#### Variable Naming Rules
```typescript
// ❌ WRONG - Undefined in client components
const url = process.env.BETTER_AUTH_URL

// ✅ CORRECT - Works in client components
const url = process.env.NEXT_PUBLIC_BETTER_AUTH_URL
```

#### Environment Variables Setup
**Server-side only** (API routes, Server Components, backend):
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`

**Client-side accessible** (browser, client components):
- `NEXT_PUBLIC_BETTER_AUTH_URL`

#### Update Auth Client
```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!, // ✅ Works in browser
})
```

#### Update Backend Config
```typescript
// elysia/config/better-auth.config.ts
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!, // ✅ Server-side only
  secret: process.env.BETTER_AUTH_SECRET!,
})
```

### After Adding Env Vars on Vercel
**IMPORTANT:** You must **redeploy** after adding/changing environment variables!

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add the variables
3. Go to Deployments tab
4. Click "Redeploy" on latest deployment

### Commit Message
```
fix(env): use NEXT_PUBLIC_ prefix for client-accessible env vars

Renamed BETTER_AUTH_URL to NEXT_PUBLIC_BETTER_AUTH_URL in client code.
Server-side code still uses BETTER_AUTH_URL without prefix for security.
```

---

## Complete Working Configuration

### Backend Auth Config
```typescript
// elysia/config/better-auth.config.ts
import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"
import { Pool } from "@neondatabase/serverless"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "../../lib/schema"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool, { schema })

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  plugins: [openAPI()],
  advanced: { 
    database: { generateId: false },
  },
  emailAndPassword: {
    enabled: true
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
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
    cookieAttributes: {
      secure: true,
      sameSite: 'lax',
      path: '/',
    }
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
  baseURL: process.env.BETTER_AUTH_URL!, // ✅ Server-side env var
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
```

### Frontend Auth Client
```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!, // ✅ Client-side env var
  fetchOptions: {
    credentials: "include",
  },
})

export const { useSession, signIn, signOut } = authClient
```

### Server Session Helper
```typescript
// lib/auth-server.ts
import { headers } from "next/headers"

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`) || c.trim().startsWith(`__Secure-${name}=`))
  
  if (!match) return null
  
  const [, value] = match.split('=')
  return value
}

function decodeSessionData(value: string) {
  try {
    const decoded = decodeURIComponent(value)
    const normalized = decoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '==='.slice((normalized.length + 3) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to decode session data:', error)
    return null
  }
}

export async function getServerSession() {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie") || ""
    
    const sessionDataCookie = getCookieValue(cookieHeader, 'better-auth.session_data')
    
    if (!sessionDataCookie) {
      return null
    }

    const sessionData = decodeSessionData(sessionDataCookie)
    
    if (!sessionData?.session) {
      return null
    }

    return {
      user: sessionData.session.user,
      session: sessionData.session.session
    }
  } catch (error) {
    console.error("Failed to get server session:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session?.user) {
    throw new Error("Authentication required")
  }
  
  return session
}
```

### Elysia Auth Middleware
```typescript
// elysia/middleware/auth.middleware.ts
import { Elysia } from "elysia"
import { auth } from "../config/better-auth.config"

export const authMiddleware = new Elysia()
  .derive(async ({ headers, set }) => {
    try {
      const session = await auth.api.getSession({
        headers: headers as any
      })

      if (!session?.user) {
        set.status = 401
        throw new Error("Unauthorized")
      }

      return {
        user: session.user,
        session: session.session
      }
    } catch (error) {
      set.status = 401
      throw new Error("Unauthorized")
    }
  })
```

### User Controller with Fallback
```typescript
// elysia/controllers/user.controller.ts
import { Elysia } from 'elysia'
import { UserService } from '../services/user.service'
import { auth } from '../config/better-auth.config'

const userService = new UserService()

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .find(c => {
      const trimmed = c.trim()
      return trimmed.startsWith(`${name}=`) || trimmed.startsWith(`__Secure-${name}=`)
    })
  
  if (!match) return null
  const [, value] = match.split('=')
  return value
}

function decodeSessionData(value: string) {
  try {
    const decoded = decodeURIComponent(value)
    const normalized = decoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '==='.slice((normalized.length + 3) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch (error) {
    return null
  }
}

function getUserFromSessionDataCookie(cookieHeader: string) {
  const raw = getCookieValue(cookieHeader, 'better-auth.session_data')
  if (!raw) return null
  
  try {
    const data = decodeSessionData(raw)
    return data?.session?.user ?? null
  } catch {
    return null
  }
}

export const userController = new Elysia({ prefix: '/users' })
  .get('/me', async ({ headers, set }) => {
    try {
      // Try Better Auth first
      let session = null
      try {
        session = await auth.api.getSession({
          headers: headers as any
        })
      } catch (betterAuthError) {
        console.log('Better Auth failed, using manual parsing')
      }

      // Fallback to manual cookie parsing
      let user = session?.user
      if (!user) {
        user = getUserFromSessionDataCookie(headers.cookie ?? '')
      }

      if (!user?.id) {
        set.status = 401
        return { error: 'No session found' }
      }

      // Fetch from database for fresh data
      const dbUser = await userService.getUserById(user.id)

      return {
        success: true,
        user: dbUser || user,
        authMethod: session ? 'better-auth' : 'manual-parsing'
      }
    } catch (error) {
      console.error('Get current user error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  })
```

---

## Environment Variables Checklist

### Required for All Environments

```env
# Database
DATABASE_URL=postgresql://...

# Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Local Development (.env.local)
```env
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Production (Vercel)
```env
BETTER_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.vercel.app
```

---

## Common Debugging Commands

### Check Session in Browser Console
```javascript
// Check cookies
document.cookie

// Check if auth client is configured
console.log(process.env.NEXT_PUBLIC_BETTER_AUTH_URL)
```

### Server-Side Logging
```typescript
// In Server Component
const headersList = await headers()
console.log("All headers:", Object.fromEntries(headersList))
console.log("Cookie:", headersList.get("cookie"))
```

### Test Endpoints
```bash
# Test session endpoint
curl https://your-app.vercel.app/api/users/me \
  -H "Cookie: better-auth.session_data=..." \
  -v

# Test debug endpoint
curl https://your-app.vercel.app/api/debug/session \
  -H "Cookie: better-auth.session_data=..." \
  -v
```

---

## Quick Reference

### When to Use What

| Scenario | Solution |
|----------|----------|
| Get user in Server Component | `getServerSession()` helper |
| Get user in Client Component | `useSession()` hook |
| Protect API route (Elysia) | `authMiddleware` |
| Check if authenticated | `const session = await getServerSession(); if (!session) redirect('/login')` |
| Require authentication | `const session = await requireAuth()` |
| Manual cookie parsing needed | Use `getCookieValue()` + `decodeSessionData()` |

### Cookie Names by Environment

| Environment | Cookie Name |
|-------------|-------------|
| Local (HTTP) | `better-auth.session_data` |
| Production (HTTPS) | `__Secure-better-auth.session_data` |

### Auth Methods Comparison

| Method | Speed | Use Case |
|--------|-------|----------|
| `auth.api.getSession()` | Slow (DB query) | API routes with token mode |
| Manual cookie decode | Fast (no DB) | Server Components with cookieCache |
| `useSession()` hook | Fast (cached) | Client Components |

---

## Additional Resources

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Elysia CORS Plugin](https://elysiajs.com/plugins/cors)

---

## Summary of All Fixes

1. ✅ **Changed backend auth config** from `NEXT_PUBLIC_BETTER_AUTH_URL` to `BETTER_AUTH_URL`
2. ✅ **Created server session helper** to decode `session_data` cookie directly
3. ✅ **Updated cookie parsing** to handle both normal and `__Secure-` prefixed cookies
4. ✅ **Fixed CORS config** to include production URLs
5. ✅ **Added referrer policy** to Google profile images
6. ✅ **Used correct env var naming** (`NEXT_PUBLIC_` for client, regular for server)
7. ✅ **Updated Google OAuth redirect URIs** for both dev and production
8. ✅ **Created fallback auth methods** for maximum reliability

---

**All issues resolved! 🎉**

This guide should help anyone setting up Better Auth with Elysia + Next.js avoid these common pitfalls.
