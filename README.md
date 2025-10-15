# LLM Wrapper API with Server-Sent Events

A Hono-based API wrapper for LLMs with streaming support using Server-Sent Events.

## Setup

1. **Get a free API key from Groq:**
   - Visit [groq.com](https://groq.com)
   - Sign up for a free account
   - Get your API key from the console

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENROUTER_API_KEY
   ```

4. **Run the server:**
   ```bash
   bun run dev
   ```

## API Endpoints

### POST /chat/completions

Send chat messages to the LLM with optional streaming.

**Request body:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "llama3-8b-8192",
  "stream": true
}
```

**Streaming response:**
- Content-Type: `text/event-stream`
- Events: `message`, `done`, `error`

**Non-streaming response:**
- Standard OpenAI-compatible JSON response

## Testing

1. Start the server: `bun run dev`
2. Open `client-example.html` in your browser
3. Type messages and see streaming responses

## Alternative Free LLM APIs

You can modify the code to use other free APIs:

- **Hugging Face**: Replace the endpoint with HF Inference API
- **Together AI**: Use their OpenAI-compatible endpoint
- **Google Gemini**: Adapt for Gemini API format
- **Cohere**: Use Cohere's streaming API

## Example Usage with curl

```bash
# Streaming request
curl -X POST http://localhost:3000/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me a joke"}],
    "stream": true
  }'

# Non-streaming request
curl -X POST http://localhost:3000/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```