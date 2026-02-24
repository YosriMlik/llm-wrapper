import { t } from 'elysia'

export const HealthResponseDto = t.Object({
  message: t.String(),
  version: t.String(),
  timestamp: t.String(),
})
