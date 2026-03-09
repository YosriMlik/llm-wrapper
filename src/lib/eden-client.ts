import { treaty } from '@elysiajs/eden'
import { app } from '../elysia/app'

export const api = treaty<typeof app>('http://localhost:3000').api
