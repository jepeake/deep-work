"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, LogIn } from "lucide-react";
import Link from "next/link";

// Create a client component for the search params
function SignInForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);
  
  const handleContinueWithoutSignIn = () => {
    // Set localStorage flag to indicate guest mode
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestMode', 'true');
      router.push('/');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        // Clear guest mode if previously set
        localStorage.removeItem('guestMode');
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 border border-black/20 rounded-lg p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-black">Sign in</h1>
        <p className="text-sm text-black/70">
          Sign in to your account to continue
        </p>
      </div>
      
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 text-black border-black/20 hover:bg-black/5"
          onClick={() => signIn("github", { callbackUrl })}
        >
          <Github className="h-4 w-4" /> Continue with GitHub
        </Button>
        
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 text-black border-black/20 hover:bg-black/5"
          onClick={handleContinueWithoutSignIn}
        >
          <LogIn className="h-4 w-4" /> Continue without signing in
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/20" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-black/70">
              Or continue with email
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-white text-black border-black/20"
            />
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-white text-black border-black/20"
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-black/90"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          
          <div className="pt-2 text-center text-sm text-black/70">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-black hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Fallback component while SignInForm is loading
function SignInFallback() {
  return (
    <div className="w-full max-w-sm space-y-6 border border-black/20 rounded-lg p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-black">Sign in</h1>
        <p className="text-sm text-black/70">Loading...</p>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-white text-black">
      <Suspense fallback={<SignInFallback />}>
        <SignInForm />
      </Suspense>
    </main>
  );
} 