import { Elysia } from 'elysia'
import { auth } from '../config/auth.config'

// Better Auth macro middleware (official pattern)
export const betterAuth = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request, set }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session) {
          set.status = 401
          return { error: 'Unauthorized', message: 'Authentication required' }
        }

        return {
          user: session.user,
          session: session.session,
        }
      },
    },
  })

// Optional auth macro (doesn't throw if not authenticated)
export const optionalAuth = new Elysia({ name: 'optional-auth' })
  .mount(auth.handler)
  .macro({
    optionalAuth: {
      async resolve({ request }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        return {
          user: session?.user || null,
          session: session?.session || null,
        }
      },
    },
  })

// Role-based auth macro
export const requireRole = (role: 'user' | 'admin') =>
  new Elysia({ name: `require-${role}` })
    .mount(auth.handler)
    .macro({
      [`require${role.charAt(0).toUpperCase() + role.slice(1)}`]: {
        async resolve({ status, request, set }) {
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session) {
            set.status = 401
            return { error: 'Unauthorized', message: 'Authentication required' }
          }

          const userRole = session.user.role || 'user'
          if (role === 'admin' && userRole !== 'admin') {
            set.status = 403
            return { error: 'Forbidden', message: 'Admin access required' }
          }

          return {
            user: session.user,
            session: session.session,
          }
        },
      },
    })
