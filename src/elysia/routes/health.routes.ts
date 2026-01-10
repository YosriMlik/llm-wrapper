import { Elysia, t } from 'elysia'
import { HealthController } from '../controllers/health.controller'

// DTOs for Health
const HealthResponseDto = t.Object({
  message: t.String(),
  version: t.String(),
  timestamp: t.String(),
})

export const healthRoutes = new Elysia()
  .get('/', HealthController.getHealth, {
    response: HealthResponseDto,
  })