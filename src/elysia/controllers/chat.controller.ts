// elysia/controllers/chat.controller.ts
import { Elysia, t } from 'elysia'
import { authController } from './auth.controller'
import { ChatRequestDto, ChatResponseDto } from '../dtos/chat.dto'

// Helper to safely get user ID
const getUserId = (user: any): string | null => {
  if (!user || typeof user !== 'object') return null
  if (user.error) return null
  return user.id || null
}

export const chatController = new Elysia({ name: 'chat-controller' })
  .use(authController) // ✅ Import auth controller to get the macro
  .group('/chat', (app) =>
    app
      // Main chat endpoint - POST /api/chat
      .post('/', async ({ body, services }: any) => {
        const response = await services.chat.sendMessage(body)
        return response
      }, {
        body: ChatRequestDto,
        response: ChatResponseDto,
      })
      
      // Save chat history - POST /api/chat/history (protected)
      .post('/history', async ({ body, services, user, set }: any) => {
        const userId = getUserId(user)
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const chatId = await services.chat.saveChatHistory(
          userId,
          body.messages,
          body.model,
          body.chatId
        )
        return { 
          success: true, 
          chatId,
          message: 'Chat history saved successfully'
        }
      }, {
        authenticated: true,
        body: t.Object({
          messages: t.Array(t.Object({
            role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
            content: t.String()
          })),
          model: t.String(),
          chatId: t.Optional(t.String()),
        }),
      })
      
      // Get all chat history - GET /api/chat/history (protected)
      .get('/history', async ({ services, user, set }: any) => {
        const userId = getUserId(user)
        // console.log('[Controller] GET /history - userId:', userId)
        // console.log('[Controller] GET /history - user object:', user)
        
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const chats = await services.chat.getChatHistory(userId)
        return { 
          success: true, 
          chats,
          total: chats.length
        }
      }, {
        authenticated: true,
      })
      
      // Get specific chat - GET /api/chat/history/:chatId (protected)
      .get('/history/:chatId', async ({ params, services, user, set }: any) => {
        const userId = getUserId(user)
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const chat = await services.chat.getChatById(params.chatId, userId)
          return { 
            success: true, 
            chat 
          }
        } catch (error) {
          set.status = 404
          return { 
            success: false,
            error: error instanceof Error ? error.message : 'Chat not found'
          }
        }
      }, {
        authenticated: true,
        params: t.Object({
          chatId: t.String()
        }),
      })
      
      // Update chat - PUT /api/chat/history/:chatId (protected)
      .put('/history/:chatId', async ({ params, body, services, user, set }: any) => {
        const userId = getUserId(user)
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const chatId = await services.chat.saveChatHistory(
            userId,
            body.messages,
            body.model,
            params.chatId
          )
          return { 
            success: true, 
            chatId,
            message: 'Chat updated successfully'
          }
        } catch (error) {
          set.status = 404
          return { 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update chat'
          }
        }
      }, {
        authenticated: true,
        params: t.Object({
          chatId: t.String()
        }),
        body: t.Object({
          messages: t.Array(t.Object({
            role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
            content: t.String()
          })),
          model: t.String(),
        }),
      })
      
      // Delete chat - DELETE /api/chat/history/:chatId (protected)
      .delete('/history/:chatId', async ({ params, services, user, set }: any) => {
        const userId = getUserId(user)
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          await services.chat.deleteChat(params.chatId, userId)
          return { 
            success: true,
            message: 'Chat deleted successfully'
          }
        } catch (error) {
          set.status = 404
          return { 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete chat'
          }
        }
      }, {
        authenticated: true,
        params: t.Object({
          chatId: t.String()
        }),
      })
  )