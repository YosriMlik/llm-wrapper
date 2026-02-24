import { betterAuth } from "better-auth"
// import Database from "better-sqlite3" // Disabled for deployment

export const auth = betterAuth({
  // database: new Database("./database.db"), // Disabled for deployment
  database: undefined, // Temporary fix for Vercel deployment
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
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