import { Elysia } from 'elysia'
import { UserService } from '../services/user.service'
import { auth } from '../config/better-auth.config'

const userService = new UserService()

const getCookieValue = (cookieHeader: string, name: string) => {
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1)
    }
  }
  return null
}

const decodeSessionData = (value: string) => {
  const decoded = decodeURIComponent(value)
  const normalized = decoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const json = Buffer.from(padded, 'base64').toString('utf-8')
  return JSON.parse(json)
}

const getUserIdFromSessionDataCookie = (cookieHeader: string) => {
  const raw = getCookieValue(cookieHeader, 'better-auth.session_data')
  if (!raw) return null
  try {
    const data = decodeSessionData(raw)
    return data?.session?.user?.id ?? data?.session?.session?.userId ?? null
  } catch {
    return null
  }
}

const toHeadersInit = (headers: Record<string, string | undefined>) => {
  const entries = Object.entries(headers).filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  )
  return entries as [string, string][]
}

export const userController = new Elysia({ prefix: '/users' })
  .get('/debug', async ({ headers }) => {
    const cookieHeader = headers.cookie ?? ''
    const rawSessionData = getCookieValue(cookieHeader, 'better-auth.session_data')
    let decodedSessionData: unknown = null
    if (rawSessionData) {
      try {
        decodedSessionData = decodeSessionData(rawSessionData)
      } catch {
        decodedSessionData = null
      }
    }

    return {
      hasCookieHeader: Boolean(cookieHeader),
      cookieHeader,
      hasSessionDataCookie: Boolean(rawSessionData),
      decodedSessionData
    }
  })
  .get('/me', async ({ headers, set }) => {
    try {
      const session = await auth.api.getSession({ headers: toHeadersInit(headers) })
      const userId =
        session?.user?.id ??
        getUserIdFromSessionDataCookie(headers.cookie ?? '')

      if (!userId) {
        set.status = 401
        return { error: 'No session token provided' }
      }

      const user = await userService.getUserById(userId)

      if (!user) {
        set.status = 404
        return { error: 'User not found' }
      }

      return {
        success: true,
        user
      }
    } catch {
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
    } catch {
      set.status = 500
      return { error: 'Internal server error' }
    }
  })
