import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Create Neon connection
const sql = neon(process.env.DATABASE_URL!)

// Create Drizzle ORM instance
export const db = drizzle(sql)

// Export the raw SQL client for direct queries if needed
export { sql }
