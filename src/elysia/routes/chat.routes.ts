import { Elysia, t } from 'elysia'
import { ChatController } from '../controllers/chat.controller'

// DTOs for Chat
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

export const chatRoutes = new Elysia()
  .post('/chat', ChatController.sendMessage, {
    body: ChatRequestDto,
    response: ChatResponseDto,
  })