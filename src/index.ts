

import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'

const app = new Hono()

// --- API Routes ---
const api = new Hono()

// In development, the Vite server needs CORS. 
// In production, the frontend is served from the same origin, so this isn't strictly necessary
// but it's fine to keep.
api.use('*', cors())

// Health check endpoint
api.get('/', (c) => {
    return c.json({ message: 'LLM Wrapper API is running' })
})

// Test endpoint to check if POST requests work
api.post('/test', async (c) => {
    try {
        const body = await c.req.json()
        console.log('Test endpoint received:', body)
        return c.json({ received: body, status: 'ok' } as { received: unknown, status: string })
    } catch (error) {
        console.log('Test endpoint error:', error)
        return c.json({ error: 'Failed to parse JSON' } as { error: string }, 400)
    }
})

// Chat completion with streaming
api.post('/chat/completions', async (c) => {
    console.log('Received POST request to /chat/completions')
    let body, messages, model, stream

    try {
        console.log('Received POST request to /chat/completions')
        body = await c.req.json()
        console.log('Request body:', JSON.stringify(body, null, 2))

        const parsed = body
        messages = parsed.messages
        model = parsed.model || 'deepseek/deepseek-r1'
        stream = parsed.stream || false

        if (!messages || !Array.isArray(messages)) {
            console.log('Invalid messages:', messages)
            return c.json({ error: 'Messages array is required' }, 400)
        }
    } catch (error) {
        console.log('Error parsing request:', error)
        return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
        return c.json({ error: 'OpenRouter API key not configured' }, 500)
    }

    
    if (stream) {
        // Directly pipe the streaming response from the LLM API to the client.
        // This is more efficient and avoids buffering issues.
        const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                                'HTTP-Referer': process.env.VITE_API_URL || 'http://localhost:3000',
                'X-Title': 'LLM Wrapper API',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        // Set the appropriate headers for a streaming response
        return streamSSE(c, async (stream) => {
            if (llmResponse.body) {
                const reader = llmResponse.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    await stream.write(value);
                }
            }
        });
    } else {

        // Non-streaming response
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.VITE_API_URL || 'http://localhost:3000',
                    'X-Title': 'LLM Wrapper API',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            })

            const data = await response.json()
            return c.json(data)
        } catch (error) {
            return c.json({ error: 'Failed to process request' }, 500)
        }
    }
})

// Register API routes under /api
app.route('/api', api)


// --- Frontend Serving ---
// Serve static assets from the client build directory
app.use('/*', serveStatic({ root: './dist/client' }))
// SPA fallback: serve index.html for any request that doesn't match a static file
app.get('*', serveStatic({ path: './dist/client/index.html' }))


const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

export default {
    port: Number(port),
    fetch: app.fetch,
}
