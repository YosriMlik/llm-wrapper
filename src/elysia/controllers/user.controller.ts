import { Elysia } from 'elysia'
import { UserService } from '../services/user.service'
import { auth } from '../config/better-auth.config'

const userService = new UserService()

export const userController = new Elysia({ prefix: '/users' })
  .get('/debug', async ({ headers }) => {
    const cookieHeader = headers.cookie ?? ''
    
    // Try to get session using Better Auth
    let session = null
    try {
      session = await auth.api.getSession({
        headers: headers as any
      })
    } catch (err) {
      console.error('Better Auth session error:', err)
    }
    
    // Check cookie formats for debugging
    const hasSecurePrefix = cookieHeader.includes('__Secure-better-auth.session_data')
    const hasNormalCookie = cookieHeader.includes('better-auth.session_data')
    
    return {
      hasCookieHeader: Boolean(cookieHeader),
      cookieHeader,
      hasSecureCookie: hasSecurePrefix,
      hasNormalCookie: hasNormalCookie,
      betterAuthSession: session ? 'Valid' : 'Invalid',
      userId: session?.user?.id ?? null,
      userName: session?.user?.name ?? null,
    }
  })
  
  .get('/me', async ({ headers, set }) => {
    try {
      const session = await auth.api.getSession({
        headers: headers as any
      })

      if (!session?.user) {
        set.status = 401
        return { error: 'No session found' }
      }

      // Optionally fetch additional user data from database
      const user = await userService.getUserById(session.user.id)

      return {
        success: true,
        user: user || session.user
      }
    } catch (error) {
      console.error('Session error:', error)
      set.status = 401
      return { error: 'Unauthorized' }
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
      console.error('Get user error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  })