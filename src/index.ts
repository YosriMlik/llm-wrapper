import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { Readable } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
    logger: true
})

// Add error handler to see what's failing
fastify.setErrorHandler((error, request, reply) => {
    console.error('Fastify error handler caught:', error)
    reply.status(500).send({ error: error.message, stack: error.stack })
})

// Register CORS
await fastify.register(cors, {
    origin: true
})

// Register static file serving (conditionally )
const staticPath = join(__dirname, '../frontend/dist/client')
if (existsSync(staticPath)) {
    await fastify.register(staticFiles, {
        root: staticPath,
        prefix: '/',
    })
    console.log('Static files registered from:', staticPath)
} else {
    console.log('Static files directory not found, serving SPA fallback only')
}

// --- API Routes ---

// Health check endpoint
fastify.get('/api/', async (request, reply) => {
    return { message: 'LLM Wrapper API is running' }
})

// Test endpoint to check if POST requests work
fastify.post('/api/test', async (request, reply) => {
    try {
        const body = request.body
        console.log('Test endpoint received:', body)
        return { received: body, status: 'ok' }
    } catch (error) {
        console.log('Test endpoint error:', error)
        reply.code(400)
        return { error: 'Failed to parse JSON' }
    }
})

// Chat completion with streaming
fastify.post('/api/chat/completions', async (request, reply) => {
    console.log('Received POST request to /chat/completions')

    try {
        const body = request.body as any
        console.log('Request body:', JSON.stringify(body, null, 2))

        const { messages, model = 'deepseek/deepseek-r1', stream = false } = body

        console.log('Parsed values - messages:', messages?.length, 'model:', model, 'stream:', stream)

        if (!messages || !Array.isArray(messages)) {
            console.log('Invalid messages:', messages)
            reply.code(400)
            return { error: 'Messages array is required' }
        }

        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            console.log('No API key found!')
            reply.code(500)
            return { error: 'OpenRouter API key not configured' }
        }

        console.log('About to check stream flag:', stream, typeof stream)

        if (stream) {
            console.log('Stream mode enabled, setting up SSE...')

            // Set headers for SSE
            reply.type('text/event-stream')
            reply.header('Cache-Control', 'no-cache')
            reply.header('Connection', 'keep-alive')
            reply.header('Access-Control-Allow-Origin', '*')
            reply.header('Access-Control-Allow-Headers', 'Cache-Control')

            console.log('Starting streaming request to OpenRouter...')
            console.log('API Key present:', !!apiKey)
            console.log('Model:', model)
            console.log('Messages count:', messages.length)

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
            })

            if (!llmResponse.ok) {
                console.error('OpenRouter API error:', llmResponse.status, llmResponse.statusText)
                reply.code(500)
                return { error: 'Failed to fetch from LLM API' }
            }

            // Process the stream and send SSE events
            if (!llmResponse.body) {
                console.error('No response body from OpenRouter')
                reply.code(500)
                return { error: 'No response body from LLM API' }
            }

            console.log('Creating readable stream...')

            // Create a Node.js readable stream
            const nodeStream = Readable.from(async function* () {
                try {
                    const reader = llmResponse.body!.getReader()
                    const decoder = new TextDecoder()
                    let buffer = ''

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() || ''

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim()

                                if (data === '[DONE]') {
                                    yield `data: [DONE]\n\n`
                                    return
                                }

                                try {
                                    const parsed = JSON.parse(data)
                                    yield `data: ${JSON.stringify(parsed)}\n\n`
                                } catch (e) {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Stream processing error:', error)
                    yield `data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`
                }
            }())

            console.log('Sending stream to client...')
            return reply.send(nodeStream)
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
                return data
            } catch (error) {
                reply.code(500)
                return { error: 'Failed to process request' }
            }
        }
    } catch (error) {
        console.error('Error in chat completions handler:', error)
        reply.code(500)
        return { error: 'Internal server error' }
    }
})

// SPA fallback: serve index.html for non-file requests
fastify.setNotFoundHandler(async (request, reply) => {
    try {
        const data = await readFile('./frontend/dist/client/index.html', 'utf8')
        reply.type('text/html')
        return data
    } catch (error) {
        reply.code(404)
        return '404 Not Found'
    }
})

// Start the server
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000
        await fastify.listen({ port, host: '0.0.0.0' })
        console.log(`Server is running on port ${port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()