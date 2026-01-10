import { Elysia, t } from 'elysia'
import { ChatService } from '../services/chat.service'
import type { ChatRequest } from '../models/chat'

// DTOs
const ChatMessageDto = t.Object({
  role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
  content: t.String(),
})

const ChatRequestDto = t.Object({
  message: t.Optional(t.String()),
  messages: t.Optional(t.Array(ChatMessageDto)),
  model: t.Optional(t.String()),
})

const ChatResponseDto = t.Object({
  response: t.String(),
  model: t.String(),
})

// Handlers
const sendMessage = async ({ body }: { body: ChatRequest }) => {
  return await ChatService.sendMessage(body)
}

// Routes
export const chatController = new Elysia()
  .post('/chat', sendMessage, {
    body: ChatRequestDto,
    response: ChatResponseDto,
  })