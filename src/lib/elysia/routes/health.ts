import { Elysia } from 'elysia'

export const healthRoutes = new Elysia()
  .get('/', () => ({
    message: 'Chatbot API is running',
    version: '1.0.0',
  }))