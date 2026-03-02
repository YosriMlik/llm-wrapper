// elysia/controllers/debug.controller.ts
import { Elysia } from "elysia"
import { auth } from "../config/better-auth.config"

export const debugController = new Elysia({ prefix: "/debug" })
  .get("/session", async ({ headers }) => {
    try {
      const session = await auth.api.getSession({
        headers: headers as any
      })
      
      return {
        success: true,
        hasSession: !!session,
        cookies: headers.cookie || "No cookies",
        user: session?.user || null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cookies: headers.cookie || "No cookies",
      }
    }
  })