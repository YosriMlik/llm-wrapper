// lib/better-auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "https://llm-wrapper-ymlik.vercel.app",
});

export const { useSession, signIn, signOut, accountInfo } = authClient;