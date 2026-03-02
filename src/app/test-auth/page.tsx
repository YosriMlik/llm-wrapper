// app/test-auth/page.tsx (Server Component)
import { getServerSession } from "@/lib/auth-server"
import { ChatService } from "@/elysia/export"
import ProtectedApiTest from "./protected-api-test"

export default async function TestAuthPage() {
  const session = await getServerSession()
  const user = session?.user

  let chatHistory: any[] = []
  if (user) {
    const chatService = new ChatService()
    chatHistory = await chatService.getChatHistory(user.id)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      {user ? (
        <div className="p-4 bg-green-100 text-green-800 rounded mb-6">
          <p className="font-semibold">✅ Authenticated User:</p>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-6">
          <p>❌ No user session found</p>
        </div>
      )}

      {/* Client Component for API Testing */}
      {user && <ProtectedApiTest />}

      {/* Server-side Chat History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Chat History (Server)</h2>
        {chatHistory.length === 0 ? (
          <p>No chat history</p>
        ) : (
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="p-4 bg-white border rounded">
                <p className="font-medium">{chat.title}</p>
                <p className="text-sm text-gray-500">{chat.model}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}