// Domain models for user and auth
export interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  token: string
}

export interface AuthRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: User
  session: Session
}