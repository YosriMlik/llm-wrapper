import { t } from 'elysia'

export const ChatMessageDto = t.Object({
  role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
  content: t.String(),
})

export const ChatRequestDto = t.Object({
  message: t.Optional(t.String()),
  messages: t.Optional(t.Array(ChatMessageDto)),
  model: t.Optional(t.String()),
})

export const ChatResponseDto = t.Object({
  response: t.String(),
  model: t.String(),
})
