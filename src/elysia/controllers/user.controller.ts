import { Elysia } from 'elysia'
import { UserService } from '../services/user.service'
import { auth } from '../config/better-auth.config'

const userService = new UserService()

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

const decodeSessionData = (value: string) => {
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

const getUserIdFromSessionDataCookie = (cookieHeader: string) => {
  // Try both cookie name formats
  let raw = getCookieValue(cookieHeader, 'better-auth.session_data')
  
  if (!raw) return null
  
  try {
    const data = decodeSessionData(raw)
    return data?.session?.user?.id ?? data?.session?.session?.userId ?? null
  } catch (err) {
    console.error('Failed to get userId from session data:', err)
    return null
  }
}

const getUserFromSessionDataCookie = (cookieHeader: string) => {
  let raw = getCookieValue(cookieHeader, 'better-auth.session_data')
  
  if (!raw) return null
  
  try {
    const data = decodeSessionData(raw)
    return data?.session?.user ?? null
  } catch (err) {
    console.error('Failed to get user from session data:', err)
    return null
  }
}

export const userController = new Elysia({ prefix: '/users' })
  .get('/debug', async ({ headers }) => {
    const cookieHeader = headers.cookie ?? ''
    
    // Try Better Auth first
    let betterAuthSession = null
    try {
      betterAuthSession = await auth.api.getSession({
        headers: headers as any
      })
    } catch (err) {
      console.error('Better Auth session error:', err)
    }
    
    // Try manual parsing
    const rawSessionData = getCookieValue(cookieHeader, 'better-auth.session_data')
    let decodedSessionData = null
    if (rawSessionData) {
      decodedSessionData = decodeSessionData(rawSessionData)
    }
    
    const hasSecurePrefix = cookieHeader.includes('__Secure-better-auth.session_data')
    const hasNormalCookie = cookieHeader.includes('better-auth.session_data')

    return {
      hasCookieHeader: Boolean(cookieHeader),
      cookieHeader,
      hasSecureCookie: hasSecurePrefix,
      hasNormalCookie: hasNormalCookie,
      hasSessionDataCookie: Boolean(rawSessionData),
      betterAuthWorks: Boolean(betterAuthSession),
      betterAuthUserId: betterAuthSession?.user?.id ?? null,
      manualParsingWorks: Boolean(decodedSessionData),
      manualParsingUserId: decodedSessionData?.session?.user?.id ?? null,
      decodedSessionData
    }
  })
  
  .get('/me', async ({ headers, set }) => {
    try {
      // Try Better Auth first (recommended approach)
      let session = null
      try {
        session = await auth.api.getSession({
          headers: headers as any
        })
      } catch (betterAuthError) {
        console.error('Better Auth failed, trying manual parsing:', betterAuthError)
      }

      // Fallback to manual parsing if Better Auth fails
      let userId = session?.user?.id
      let user = session?.user

      if (!userId) {
        console.log('Falling back to manual cookie parsing')
        userId = getUserIdFromSessionDataCookie(headers.cookie ?? '')
        user = getUserFromSessionDataCookie(headers.cookie ?? '')
      }

      if (!userId) {
        set.status = 401
        return { error: 'No session token provided' }
      }

      // Fetch fresh user data from database
      const dbUser = await userService.getUserById(userId)

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
  
  .get('/:id', async ({ params, set }) => {
    try {
      const user = await userService.getUserById(params.id)

      if (!user) {
        set.status = 404
        return { error: 'User not found' }
      }

      return {
        success: true,
        user
      }
    } catch (error) {
      console.error('Get user by ID error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  })
