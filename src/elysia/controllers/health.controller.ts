import { Elysia } from 'elysia'

// Handlers
const getHealth = () => {
  return {
    message: 'Chatbot API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }
}

// Routes
export const healthController = new Elysia()
  .get('/', getHealth, )
