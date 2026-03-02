// app/test-auth/protected-api-test.tsx (Client Component)
"use client"

import { useEffect, useState } from "react"

export default function ProtectedApiTest() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testApi() {
      try {
        const response = await fetch('/api/chat/history', {
          method: 'GET',
          credentials: 'include', // ✅ This sends cookies from browser
        })
        
        if (response.ok) {
          const data = await response.json()
          setResult(data)
        } else {
          setError(`${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch')
      } finally {
        setLoading(false)
      }
    }

    testApi()
  }, [])

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Protected API Test (Client)</h2>
      
      {loading && (
        <div className="p-4 bg-blue-100 text-blue-800 rounded">
          Testing API endpoint...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          <p className="font-semibold">❌ API Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          <p className="font-semibold">✅ API Response:</p>
          <p>Total chats: {result.total}</p>
          <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}