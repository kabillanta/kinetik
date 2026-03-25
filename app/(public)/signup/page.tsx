/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Users,
  CheckCircle2,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<
    "VOLUNTEER" | "ORGANIZER" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // --- 1. The Function to Sync with Backend ---
  const saveUserToBackend = async (firebaseUser: any, role: string) => {
    try {
      // Get the Firebase ID Token to verify identity on backend
      const token = await firebaseUser.getIdToken();

      // Send to your Python/FastAPI Backend
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Secure the request
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || name, // Fallback to state name
          role: role, // The Critical Part!
          photo_url: firebaseUser.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync user with database");
      }
    } catch (err) {
      console.error("Backend Sync Error:", err);
      // Optional: You might want to let them in anyway, but show a warning
    }
  };

  // --- 2. Handlers ---

  const handleGoogleSignup = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    setError(null);
    try {
      // A. Login with Firebase
      const result = await signInWithGoogle();
      const currentUser = result.user;

      if (currentUser) {
        // B. Save to Database
        await saveUserToBackend(currentUser, selectedRole);
        
        // C. Save role locally
        localStorage.setItem("kinetik_user_role", selectedRole);

        toast("Welcome to KinetiK!", "success");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google sign-in failed.");
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !password || !name) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // A. Create User in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // B. Add Display Name in Firebase
      await updateProfile(userCredential.user, { displayName: name });

      // C. Save to Database
      await saveUserToBackend(userCredential.user, selectedRole);

      // D. Save role locally for immediate dashboard access
      localStorage.setItem("kinetik_user_role", selectedRole);

      toast("Account created successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Signup failed.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 relative overflow-hidden text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none" />
      <div className="absolute top-0 right-0 h-[600px] w-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: "2s" }} />

      {/* Navigation Header */}
      <div className="relative z-10 w-full max-w-4xl mb-12 flex justify-between items-center">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.push("/"))}
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {step === 2 ? "Back to Roles" : "Back to Home"}
        </button>
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
           <span className="font-bold text-white">K</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          {step === 1 ? "Choose your path" : "Create your account"}
        </h1>
        <p className="text-slate-500 text-xl font-medium">
          {step === 1
            ? "How will you use KinetiK today?"
            : `Signing up as a ${selectedRole?.toLowerCase()}`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="relative z-20 mb-8 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-50 p-5 text-red-600 max-w-md mx-auto animate-in fade-in slide-in-from-top-2 shadow-xl shadow-red-500/5">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* STEP 1: ROLE SELECTION */}
      {step === 1 && (
        <div className="relative z-10 grid md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4">
          {/* Option 1: Volunteer */}
          <button
            onClick={() => setSelectedRole("VOLUNTEER")}
            className={`group relative flex flex-col items-start p-10 rounded-[2.5rem] border transition-all duration-500 text-left ${
              selectedRole === "VOLUNTEER"
                ? "bg-white border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
                : "bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 ${
                selectedRole === "VOLUNTEER"
                  ? "bg-primary text-white scale-110 rotate-3"
                  : "bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
              }`}
            >
              <User className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              I am a Volunteer
            </h3>
            <p className="text-slate-500 text-base mb-8 leading-relaxed font-medium">
              Join high-impact projects and build your professional reputation.
            </p>
            <ul className="space-y-3 mt-auto w-full">
              <li className="flex items-center text-sm text-slate-600 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-3 text-primary" /> Verified
                Impact Tracking
              </li>
              <li className="flex items-center text-sm text-slate-600 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-3 text-primary" /> AI
                Powered Matching
              </li>
            </ul>
          </button>

          {/* Option 2: Organizer */}
          <button
            onClick={() => setSelectedRole("ORGANIZER")}
            className={`group relative flex flex-col items-start p-10 rounded-[2.5rem] border transition-all duration-500 text-left ${
              selectedRole === "ORGANIZER"
                ? "bg-white border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
                : "bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 ${
                selectedRole === "ORGANIZER"
                  ? "bg-primary text-white scale-110 -rotate-3"
                  : "bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
              }`}
            >
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              I am an Organizer
            </h3>
            <p className="text-slate-500 text-base mb-8 leading-relaxed font-medium">
              Scale your community events with a pool of verified talent.
            </p>
            <ul className="space-y-3 mt-auto w-full">
              <li className="flex items-center text-sm text-slate-600 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-3 text-primary" /> Global
                Talent Pool
              </li>
              <li className="flex items-center text-sm text-slate-600 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-3 text-primary" /> Seamless
                Event Lifecycle
              </li>
            </ul>
          </button>

          <div
            className={`col-span-1 md:col-span-2 mt-12 flex justify-center transition-all duration-500 ${selectedRole ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
          >
            <button
              onClick={() => setStep(2)}
              className="group flex items-center gap-3 rounded-2xl bg-slate-900 px-12 py-5 text-lg font-black text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95"
            >
              Continue
              <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AUTHENTICATION FORM */}
      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="glass rounded-[2.5rem] p-10 shadow-2xl shadow-primary/10 border border-white/40">
            {/* Google Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-white border border-slate-200 px-6 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50"
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

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                <span className="bg-white/50 px-4 backdrop-blur-sm">
                  Or via Email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignup} className="space-y-6">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-2 flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-2 flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="mt-2 flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-900 py-5 text-sm font-black text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                Create Account
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-500 font-medium">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-slate-900 font-bold hover:underline underline-offset-4">
                Terms of Service.
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
