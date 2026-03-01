import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"
import { Pool } from "@neondatabase/serverless"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "../../lib/schema"

// Create Neon connection pool for better-auth
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool, { schema })

export const auth = betterAuth({
  //basePath: "/auth",
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL provider
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  plugins: [ openAPI() ],
  advanced: { 
    database: { generateId: false }
  },
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      //prompt: "select_account", 
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,

  baseURL: process.env.BETTER_AUTH_URL!,
})

// Correct type inference for Better Auth
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
