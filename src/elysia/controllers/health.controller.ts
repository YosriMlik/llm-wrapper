export class HealthController {
  static getHealth() {
    return {
      message: 'Chatbot API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }
}