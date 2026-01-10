import { Elysia, t } from 'elysia'

// DTOs
const HealthResponseDto = t.Object({
  message: t.String(),
  version: t.String(),
  timestamp: t.String(),
})

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
  .get('/', getHealth, {
    response: HealthResponseDto,
  })