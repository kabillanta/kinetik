"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight,
  UserCheck,
  Briefcase,
  MapPin,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, refreshProfile } = useAuth();

  // If user already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (userProfile?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"volunteer" | "organizer" | "">("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddSkill = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>,
  ) => {
    if (
      (e.type === "keydown" && (e as React.KeyboardEvent).key === "Enter") ||
      e.type === "blur"
    ) {
      e.preventDefault();
      if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
        setSkills([...skills, currentSkill.trim()]);
        setCurrentSkill("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");

    try {
      const userProfileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role as "volunteer" | "organizer",
        bio,
        location,
        skills,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), userProfileData);

      // Sync user profile to Neo4j backend
      try {
        const token = await user.getIdToken();
        await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firebase_uid: user.uid,
            email: user.email,
            name: user.displayName,
            role: role,
            photo_url: user.photoURL || '',
          })
        });

        // Also sync skills
        await fetch(`${API_BASE_URL}/api/users/skills`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(skills)
        });
      } catch (backendErr) {
        console.warn('Failed to sync with Neo4j backend — user saved to Firestore only', backendErr);
      }

      await refreshProfile();
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error during onboarding:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans flex flex-col items-center justify-center px-4 py-12 selection:bg-blue-200 fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl mx-auto bg-gradient-to-tr from-zinc-800 to-black flex items-center justify-center shadow-lg mb-6">
            <span className="font-semibold text-white text-3xl leading-none">
              K
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-black mb-3">
            Welcome to KinetiK
          </h1>
          <p className="text-[#86868B] text-lg font-medium">
            Let&apos;s set up your profile to personalize your experience.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-black/[0.04] relative overflow-hidden">
          {/* Progress Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100">
            <div
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-black mb-2">
                  How do you want to use KinetiK?
                </h2>
                <p className="text-[#86868B] text-sm">
                  You can always switch between modes later.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setRole("volunteer")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${role === "volunteer" ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-600/10" : "border-black/[0.08] hover:border-black/[0.15] bg-white"}`}
                >
                  {role === "volunteer" && (
                    <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-blue-600" />
                  )}
                  <UserCheck
                    className={`h-8 w-8 mb-4 ${role === "volunteer" ? "text-blue-600" : "text-zinc-400"}`}
                  />
                  <h3 className="font-semibold text-black text-lg mb-1">
                    I want to volunteer
                  </h3>
                  <p className="text-[#86868B] text-sm font-medium">
                    Find events matching my skills and make an impact.
                  </p>
                </button>

                <button
                  onClick={() => setRole("organizer")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${role === "organizer" ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-600/10" : "border-black/[0.08] hover:border-black/[0.15] bg-white"}`}
                >
                  {role === "organizer" && (
                    <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-blue-600" />
                  )}
                  <Briefcase
                    className={`h-8 w-8 mb-4 ${role === "organizer" ? "text-blue-600" : "text-zinc-400"}`}
                  />
                  <h3 className="font-semibold text-black text-lg mb-1">
                    I am an organizer
                  </h3>
                  <p className="text-[#86868B] text-sm font-medium">
                    Create events, find talent, and track our impact.
                  </p>
                </button>
              </div>

              <button
                disabled={!role}
                onClick={() => setStep(2)}
                className="w-full mt-8 py-4 rounded-xl bg-black text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Info */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-black mb-2">
                  Tell us a bit about yourself
                </h2>
                <p className="text-[#86868B] text-sm">
                  This helps us{" "}
                  {role === "volunteer"
                    ? "find the best opportunities for you"
                    : "connect with incredible talent"}
                  .
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Short Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="I&apos;m a passionate developer looking to help non-profits with their websites..."
                    className="w-full p-4 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none h-32 text-black font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    City/Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl bg-zinc-100 text-black font-semibold hover:bg-zinc-200 transition-all"
                >
                  Back
                </button>
                <button
                  disabled={!bio.trim() || !location.trim()}
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-xl bg-black text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-black mb-2">
                  What are your superpowers?
                </h2>
                <p className="text-[#86868B] text-sm">
                  Add your skills to improve your AI recommendations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500 fill-yellow-500/20" />
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyDown={handleAddSkill}
                      onBlur={handleAddSkill}
                      placeholder="Type a skill and press Enter..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium mt-2 ml-1">
                    e.g. React, Event Planning, Marketing, Python
                  </p>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium animate-in zoom-in-50"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-black/[0.04]">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-4 rounded-xl bg-zinc-100 text-black font-semibold hover:bg-zinc-200 transition-all"
                >
                  Back
                </button>
                <button
                  disabled={isLoading || skills.length === 0}
                  onClick={completeOnboarding}
                  className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Complete Profile"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
