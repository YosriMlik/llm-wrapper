import { auth } from '../config/auth.config'
import type { User } from '../config/auth.config'

export class AuthService {
  // Get session from request
  async getSession(request: Request) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  // Get session from headers object
  async getSessionFromHeaders(headers: Record<string, string | undefined>) {
    try {
      // Convert headers object to Headers instance
      const headersInstance = new Headers()
      Object.entries(headers).forEach(([key, value]) => {
        if (value) headersInstance.set(key, value)
      })

      const session = await auth.api.getSession({
        headers: headersInstance,
      })
      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  // Check if user has required role
  hasRole(user: User, requiredRole: 'user' | 'admin'): boolean {
    if (requiredRole === 'user') {
      return true // All users have 'user' role
    }
    return (user.role as string) === requiredRole
  }

  // Check if user can access AI models (example business logic)
  canAccessAiModels(user: User): boolean {
    return this.hasRole(user, 'user') // All authenticated users can access
  }

  // Check if user can access chat (example business logic)
  canAccessChat(user: User): boolean {
    return this.hasRole(user, 'user') // All authenticated users can access
  }

  // Check if user is admin
  isAdmin(user: User): boolean {
    return this.hasRole(user, 'admin')
  }
}