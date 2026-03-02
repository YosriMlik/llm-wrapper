import { db } from '@/lib/db'
import { users, sessions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { User } from '../models/user'

export class UserService {
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
      }).from(users).where(eq(users.id, userId)).limit(1)
      
      return user[0] || null
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      return null
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
      }).from(users).where(eq(users.email, email)).limit(1)
      
      return user[0] || null
    } catch (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
  }

  async getCurrentUserFromSession(sessionId: string): Promise<User | null> {
    try {
      // Join with sessions table to get user from session
      const result = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
      }).from(users)
      .innerJoin(sessions, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sessionId))
      .limit(1)
      
      return result[0] || null
    } catch (error) {
      console.error('Error fetching current user from session:', error)
      return null
    }
  }


}