import { useState, useEffect } from 'react'

export interface UserData {
  id: string
  name: string
  email: string
  image: string | null
  role: string | null
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
          cache: 'no-store', // Don't cache
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - this is expected
            setUser(null)
          } else {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return
        }

        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [refetchTrigger])

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  return { user, loading, error, refetch }
}