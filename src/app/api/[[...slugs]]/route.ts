// app/api/[[...slugs]]/route.ts
import { app } from '@/elysia/app'

export const GET = app.fetch
export const POST = app.fetch