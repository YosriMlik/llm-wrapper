# AI Chatbot

A modern AI chatbot built with Next.js and OpenRouter API. Chat with multiple AI models through a clean, responsive interface.

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/YosriMlik/llm-wrapper
   cd <project-name>
   npm install
   ```

2. **Add your API key**
   Create a `.env.local` file:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Get API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

## Tech Stack

- **Next.js 16** - React framework with App Router for optimal performance
- **Elysia** - Ultra-fast TypeScript web framework for API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **OpenRouter API** - Access to multiple AI models

## Available Models

- Mistral Devstral (default)
- Nvidia Nemotron Nano
- OpenAI OSS 120B
- Xiaomi Mimo Flash

All models are free tier from OpenRouter.
