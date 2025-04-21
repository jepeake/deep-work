import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This is the handler that Next.js App Router uses for API routes
const handler = NextAuth(authOptions);

// Export the handler as named exports for GET and POST methods
export { handler as GET, handler as POST }; 