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
      const result = await signInWithGoogle(); // Ensure your auth-context returns the userCredential!

      // Note: If signInWithGoogle doesn't return the user object directly in your context,
      // you might need to rely on the `auth.currentUser` right after await.
      const currentUser = auth.currentUser;

      if (currentUser) {
        // B. Save to Database
        await saveUserToBackend(currentUser, selectedRole);
        
        // C. Save role locally
        localStorage.setItem("kinetik_user_role", selectedRole);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-6 py-12 relative overflow-hidden text-[#1D1D1F]">
      {/* ... (Keep your existing UI Code: Background, Header, Step 1 Role Selection) ... */}

      {/* Background Decor */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <div className="relative z-10 w-full max-w-4xl mb-8">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.push("/"))}
          className="inline-flex items-center text-sm text-[#86868B] hover:text-black transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {step === 2 ? "Back to Roles" : "Back to Home"}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold text-black mb-4 tracking-tight">
          {step === 1 ? "Choose your path" : "Create your account"}
        </h1>
        <p className="text-[#86868B] text-lg font-medium">
          {step === 1
            ? "How will you use KinetiK today?"
            : `Signing up as a ${selectedRole?.toLowerCase()}`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="relative z-20 mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400 max-w-md mx-auto animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* STEP 1: ROLE SELECTION */}
      {step === 1 && (
        <div className="relative z-10 grid md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4">
          {/* Option 1: Volunteer */}
          <button
            onClick={() => setSelectedRole("VOLUNTEER")}
            className={`group relative flex flex-col items-start p-8 rounded-2xl border transition-all duration-300 text-left ${
              selectedRole === "VOLUNTEER"
                ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/50"
                : "bg-white/50 border-black/[0.04] hover:bg-white hover:border-black/[0.08] hover:shadow-lg"
            }`}
          >
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center mb-6 transition-colors ${
                selectedRole === "VOLUNTEER"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-black"
              }`}
            >
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2 tracking-tight">
              I am a Volunteer
            </h3>
            <p className="text-[#86868B] text-sm mb-6 leading-relaxed font-medium">
              Find hackathons and meetups to support.
            </p>
            <ul className="space-y-2 mt-auto">
              <li className="flex items-center text-xs text-[#86868B] font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500" /> Build
                reputation
              </li>
              <li className="flex items-center text-xs text-[#86868B] font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500" /> AI
                recommendations
              </li>
            </ul>
          </button>

          {/* Option 2: Organizer */}
          <button
            onClick={() => setSelectedRole("ORGANIZER")}
            className={`group relative flex flex-col items-start p-8 rounded-2xl border transition-all duration-300 text-left ${
              selectedRole === "ORGANIZER"
                ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/50"
                : "bg-white/50 border-black/[0.04] hover:bg-white hover:border-black/[0.08] hover:shadow-lg"
            }`}
          >
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center mb-6 transition-colors ${
                selectedRole === "ORGANIZER"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-black"
              }`}
            >
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2 tracking-tight">
              I am an Organizer
            </h3>
            <p className="text-[#86868B] text-sm mb-6 leading-relaxed font-medium">
              Recruit skilled volunteers for events.
            </p>
            <ul className="space-y-2 mt-auto">
              <li className="flex items-center text-xs text-[#86868B] font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500" /> Post
                events
              </li>
              <li className="flex items-center text-xs text-[#86868B] font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500" /> Match
                with talent
              </li>
            </ul>
          </button>

          <div
            className={`col-span-1 md:col-span-2 mt-8 flex justify-center transition-all duration-500 ${selectedRole ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-3 rounded-full bg-black px-10 py-4 text-base font-bold text-white hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all"
            >
              Continue <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AUTHENTICATION FORM */}
      {step === 2 && (
        <div className="relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-black/[0.04] bg-white p-8 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-right-8">
          {/* Google Button */}
          <button
            onClick={handleGoogleSignup}
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
            Sign up with Google
          </button>

          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-white px-4 text-zinc-400 rounded-full">
              Or via Email
            </span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-2 flex h-12 w-full rounded-xl border border-black/[0.08] bg-zinc-50 px-4 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-2 flex h-12 w-full rounded-xl border border-black/[0.08] bg-zinc-50 px-4 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="mt-2 flex h-12 w-full rounded-xl border border-black/[0.08] bg-zinc-50 px-4 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-zinc-800 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Create Account
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500">
            By creating an account, you agree to our Terms of Service.
          </p>
        </div>
      )}
    </div>
  );
}
