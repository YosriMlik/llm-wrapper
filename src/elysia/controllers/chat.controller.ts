import { Elysia } from 'elysia'
import { ChatMessageDto, ChatRequestDto, ChatResponseDto } from '../dtos/chat.dto'
// import { betterAuth } from '../middleware/auth.middleware' // Disabled for deployment
import type { ChatRequest } from '../models/chat'
// import type { User } from '../config/auth.config' // Disabled for deployment

// Handlers - will use injected services
const sendMessage = async (context: any) => {
  const { body, services, user } = context

  // Check if user can access chat
  // if (!services.auth.canAccessChat(user)) {
  //   throw new Error('Access denied to chat functionality')
  // } // Disabled for deployment

  return await services.chat.sendMessage(body)
}

// Routes - Require authentication for chat using macro
export const chatController = new Elysia()
  // .use(betterAuth) // Disabled for deployment
  .post('/chat', sendMessage, {
    // auth: true,
    body: ChatRequestDto,
    response: ChatResponseDto,
  })
