"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Github, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      console.error("Login Failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 relative overflow-hidden text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute top-1/4 right-0 h-[400px] w-[400px] bg-accent/5 blur-[100px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: "2s" }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-[2.5rem] p-10 shadow-2xl shadow-primary/10 border border-white/40">
          {/* Header */}
          <div className="mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2 group mb-8">
               <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="font-bold text-white">K</span>
               </div>
               <span className="font-bold text-2xl text-slate-900 tracking-tight">KinetiK</span>
            </Link>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Welcome back
            </h2>
            <p className="text-slate-500 font-medium">
              Sign in to your dashboard to manage events or track applications.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 px-6 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              onClick={() => toast("GitHub login is coming soon!", "info")}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/10"
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white/50 px-4 text-slate-400 backdrop-blur-sm">
                Or continue with
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center">
            <p className="text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] uppercase tracking-wider">Coming Soon</span>
              Email and password login
            </p>
          </div>

          <div className="mt-10 text-center text-sm text-slate-500 font-medium">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
