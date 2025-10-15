import { createLazyFileRoute } from '@tanstack/react-router'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import deepseekLogo from "/assets/DeepSeek-icon.svg";

export const Route = createLazyFileRoute('/')({
  component: Chat,
})

// Define the message structure
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function Chat() {
  // Load messages from sessionStorage on mount
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const saved = sessionStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = React.useState('');

  // Save messages to sessionStorage whenever they change
  React.useEffect(() => {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Add a placeholder for the assistant's response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages, // Send the whole conversation
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get a streaming response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0].delta.content) {
                const contentChunk = parsed.choices[0].delta.content;
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    // Append the chunk to the last assistant message
                    const updatedMessages = [...prev];
                    updatedMessages[prev.length - 1] = {
                      ...lastMessage,
                      content: lastMessage.content + contentChunk,
                    };
                    return updatedMessages;
                  }
                  return prev;
                });
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    }
  };

  // Ref for the dummy div at the end of the messages
  const endRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ padding: '0rem 1rem', fontFamily: 'sans-serif', margin: 'auto' }}>
      <h3>Full-Stack Chat</h3>
      <div style={{ height: '73vh', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#007bff' : '#e9ecef',
              color: msg.role === 'user' ? 'white' : 'black',
              padding: '.7rem 1rem',
              borderRadius: '1rem',
              maxWidth: '75%',
              display: 'flex',
              flexDirection: 'row', // always row
              alignItems: 'flex-start',
              gap: '5rem',
            }}
          >
            {msg.role === 'assistant' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <img
                  src={deepseekLogo}
                  alt="DeepSeek"
                  style={{ width: 24, height: 24, marginBottom: '0.5rem' }}
                />
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            )}
          </div>
        ))}
        <div ref={endRef} /> {/* This is the dummy div */}
      </div>
      <div style={{ display: 'flex', marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flexGrow: 1, padding: '0.5rem' }}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} style={{ padding: '0.5rem 1rem' }}>
          Send
        </button>
      </div>
      <center style={{ textAlign: "center", marginTop: "1rem" }}>By <a target='blank' href='https://github.com/YosriMlik/'>Yosri Mlik</a></center>
    </div>
  );
}