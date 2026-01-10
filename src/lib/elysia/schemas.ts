import { t } from 'elysia'

export const chatSchema = {
  body: t.Object({
    message: t.Optional(t.String()),
    messages: t.Optional(t.Array(t.Object({
      role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
      content: t.String(),
    }))),
    model: t.Optional(t.String()),
  }),
}