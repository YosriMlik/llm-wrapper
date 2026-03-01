"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"
import { useState } from "react"

import { authClient } from "@/elysia/config/better-auth-client";

interface GoogleAuthDialogProps {
  children: React.ReactNode
  functionality: string
}

export function GoogleAuthDialog({ children, functionality }: GoogleAuthDialogProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true)
    try {
      console.log("Starting Google sign in...")
      const result = await authClient.signIn.social({
        provider: "google",
      });
      console.log("Google sign in result:", result)
    } catch (error) {
      console.error("Google sign in error:", error)
      setIsLoggingIn(false)
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{functionality}</AlertDialogTitle>
          <AlertDialogDescription>
            Sign in with Google to access {functionality.toLowerCase()} and save your chat history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Google
              </>
            )}
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}