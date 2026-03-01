// "use client"

// import { signIn, signOut, useSession } from "better-auth/react"
// import { Button } from "@/components/ui/button"
// import { User, LogOut, LogIn } from "lucide-react"

// export function AuthButton() {
//   const { data: session, status } = useSession()

//   if (status === "loading") {
//     return <div>Loading...</div>
//   }

//   if (session) {
//     return (
//       <div className="flex items-center gap-2">
//         <div className="flex items-center gap-2 text-sm">
//           <User className="h-4 w-4" />
//           <span>{session.user.name || session.user.email}</span>
//         </div>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => signOut()}
//           className="flex items-center gap-2"
//         >
//           <LogOut className="h-4 w-4" />
//           Sign Out
//         </Button>
//       </div>
//     )
//   }

//   return (
//     <Button
//       variant="outline"
//       size="sm"
//       onClick={() => signIn("google")}
//       className="flex items-center gap-2"
//     >
//       <LogIn className="h-4 w-4" />
//       Sign In with Google
//     </Button>
//   )
// }