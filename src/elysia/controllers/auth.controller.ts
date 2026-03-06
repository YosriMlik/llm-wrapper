// elysia/controllers/auth.controller.ts
import { Elysia } from 'elysia'
import { auth } from '../config/better-auth.config'
import { getSessionFromCookie } from '../../lib/better-auth-server'

export const authController = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    authenticated: {
      async resolve({ set, request }) {
        try {
          const cookieHeader = request.headers.get("cookie") || ""
          // console.log('[Elysia] [Auth] Cookie header:', cookieHeader.slice(0, 100))
          
          // Use manual cookie parsing for session_data cookie
          const session = getSessionFromCookie(cookieHeader)
          
          // console.log('[Elysia] [Auth] Session:', session ? 'Found' : 'Not found')
          // console.log('[Elysia] [Auth] User:', session?.user?.email || 'No user')

          if (!session?.user) {
            // console.log('[Elysia] [Auth] Authentication failed - no session')
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
          console.error('[Elysia] [Auth] Authentication error:', error)
          set.status = 401
          return {
            error: 'Authentication failed'
          }
        }
      }
    }
  })

// OpenAPI schema exports...
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/api/auth') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]
          operation.tags = ['Better Auth']
        }
      }

      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>
} as const