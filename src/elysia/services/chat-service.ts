// elysia/services/chat.service.ts
import { createOpenRouterService } from './openrouter-service'
import { DEFAULT_AI_MODEL } from '../config/ai-models.config'
import type { ChatMessage, ChatRequest, ChatResponse } from '../models/chat'
import { db } from '@/lib/db'
import { chatHistory } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'

export class ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, messages, model } = request

    // Validate message
    if (!message && (!messages || messages.length === 0)) {
      throw new Error('Message or messages array is required')
    }

    // Create OpenRouter service
    const openRouterService = createOpenRouterService()
    if (!openRouterService) {
      throw new Error('OpenRouter API key not configured')
    }

    // Use provided model or default
    const selectedModel = model || DEFAULT_AI_MODEL

    // Build messages array
    let chatMessages: ChatMessage[]
    if (messages && Array.isArray(messages) && messages.length > 0) {
      chatMessages = messages
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }]
    } else {
      throw new Error('Message or messages array is required')
    }

    try {
      const response = await openRouterService.chat(selectedModel, chatMessages)

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from AI model')
      }

      return {
        response: response.choices[0].message.content,
        model: response.model || selectedModel,
      }
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response')
    }
  }

  // Chat History Methods - userId is now REQUIRED
  async saveChatHistory(
    userId: string, // ✅ Required, not optional
    messages: ChatMessage[],
    model: string,
    chatId?: string
  ): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const title = this.generateChatTitle(messages)
    const messagesJson = JSON.stringify(messages)

    if (chatId) {
      const [result] = await db
        .update(chatHistory)
        .set({
          messages: messagesJson,
          model,
          updatedAt: new Date(),
        })
        .where(and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)))
        .returning({ id: chatHistory.id })

      if (!result) {
        throw new Error('Chat not found or unauthorized')
      }

      return result.id
    }

    const [result] = await db
      .insert(chatHistory)
      .values({
        userId,
        title,
        messages: messagesJson,
        model,
      })
      .returning({ id: chatHistory.id })

    return result.id
  }

  async getChatHistory(userId: string) {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // console.log('[Service] Fetching chat history for userId:', userId)

    const chats = await db
      .select({
        id: chatHistory.id,
        title: chatHistory.title,
        model: chatHistory.model,
        createdAt: chatHistory.createdAt,
        updatedAt: chatHistory.updatedAt,
      })
      .from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      .orderBy(desc(chatHistory.updatedAt))

    // console.log('[Service] Found', chats.length, 'chats for user:', userId)
    return chats
  }

  async getChatById(chatId: string, userId: string) {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const [chat] = await db
      .select()
      .from(chatHistory)
      .where(and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)))
      .limit(1)

    if (!chat) {
      throw new Error('Chat not found')
    }

    return {
      ...chat,
      messages: JSON.parse(chat.messages) as ChatMessage[],
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const [result] = await db
      .delete(chatHistory)
      .where(and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)))
      .returning({ id: chatHistory.id })

    if (!result) {
      throw new Error('Chat not found or unauthorized')
    }

    return true
  }

  // Helper method
  private generateChatTitle(messages: ChatMessage[]): string {
    const firstMessage = messages.find(m => m.role === 'user')?.content
    if (!firstMessage) return 'New Chat'
    
    // Clean and truncate
    return firstMessage
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 60) + (firstMessage.length > 60 ? '...' : '')
  }
}