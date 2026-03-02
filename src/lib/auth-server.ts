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

// For Elysia controllers - accepts cookie header string
export function getSessionFromCookie(cookieHeader: string): { user: any; session: any } | null {
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
}

// For Next.js server components
export async function getServerSession() {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get("cookie") || ""
    
    return getSessionFromCookie(cookieHeader)
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