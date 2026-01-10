import { ChatService } from '../services/chat.service'
import type { ChatRequest } from '../models/chat'

export class ChatController {
  static async sendMessage({ body }: { body: ChatRequest }) {
    const response = await ChatService.sendMessage(body)
    return response
  }
}