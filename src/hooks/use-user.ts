import { useState, useEffect } from 'react'
import { api } from '@/lib/eden-treaty'

export interface UserData {
  id: string
  name: string
  email: string
  image?: string | null | undefined
  role?: string | null
  emailVerified?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const SESSION_STORAGE_KEY = 'user-data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Load user from session storage on mount
  useEffect(() => {
    const loadUserFromSession = () => {
      try {
        const cachedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          
          // Check if cache is still valid (5 minutes)
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('Loading user from session cache');
            setUser(data);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error reading from session storage:', error);
      }
      
      // If no valid cache, fetch from API
      fetchUserFromAPI();
    };

    loadUserFromSession();
  }, []);

  const fetchUserFromAPI = async () => {
    setLoading(true)
    try {
      const response = await api.users.me.get()

      if (response.data) {
        const data = response.data
        if (data.success && data.user) {
          // Store in session storage
          const sessionData = {
            data: data.user,
            timestamp: Date.now()
          };
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          console.log('Fetched user from API and cached');
          
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        // Handle error case
        setUser(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    // Clear session cache and refetch
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setRefetchTrigger(prev => prev + 1)
  }

  const clearUserCache = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  };

  return { user, loading, error, refetch, clearUserCache }
}