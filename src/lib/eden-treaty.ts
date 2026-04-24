import { treaty } from '@elysiajs/eden'
import { app } from '../elysia/app'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return window.location.origin
  }

  // Server environment (mostly not gonna use it, because we can just call the elysia service directly in server components)
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string;
}

export const api = treaty<typeof app>(getBaseUrl()).api
