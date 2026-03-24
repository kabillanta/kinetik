"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Github, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if already logged in (Auto-redirect)
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Note: The useEffect above will handle the redirect automatically
      // once the user state updates, but we add this for immediate feedback.
      router.push("/dashboard");
    } catch (error) {
      console.error("Login Failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-6 relative overflow-hidden text-[#1D1D1F]">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-md space-y-8 rounded-3xl border border-black/[0.04] bg-white p-8 md:p-10 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-[#86868B] hover:text-black transition-colors mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to KinetiK
          </Link>
          <h2 className="text-3xl font-bold font-sans tracking-tight text-black">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[#86868B] font-medium">
            Sign in to your dashboard to manage events or track applications.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-zinc-50 border border-black/[0.08] px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-100 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isLoading ? "Authenticating..." : "Continue with Google"}
          </button>

          <button
            onClick={() => toast("GitHub login is coming soon!", "info")}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-semibold text-[#1D1D1F] transition-all hover:bg-zinc-50"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/[0.04]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-white px-4 text-[#86868B] rounded-full">
              Or continue with
            </span>
          </div>
        </div>

        {/* Email Login — Coming Soon */}
        <div className="rounded-2xl border border-black/[0.04] bg-zinc-50 p-6 text-center">
          <p className="text-sm text-[#86868B] font-medium">
            <span className="inline-block px-2.5 py-0.5 bg-zinc-200 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-wider mr-2">Coming Soon</span>
            Email & password login
          </p>
        </div>

        <div className="text-center text-sm text-[#86868B] font-medium">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
