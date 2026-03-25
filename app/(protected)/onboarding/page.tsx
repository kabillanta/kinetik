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
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";

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
        console.warn('Failed to sync with Neo4j backend: user saved to Firestore only', backendErr);
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
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden selection:bg-primary/20">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-accent/5 blur-[100px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: "3s" }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl mx-auto bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mb-8 transform hover:scale-110 transition-transform cursor-pointer">
            <span className="font-black text-white text-3xl">K</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4">
            Welcome to KinetiK
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Complete your profile to unlock a personalized experience.
          </p>
        </div>

        <div className="glass rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-primary/10 border border-white/40 relative overflow-hidden">
          {/* Progress Header */}
          <div className="absolute top-0 left-0 w-full px-14 py-8 flex justify-between items-center pointer-events-none">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step {step} of 3</span>
             <div className="flex gap-1.5">
                {[1,2,3].map(s => (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'w-8 bg-primary' : 'w-2 bg-slate-100'}`} />
                ))}
             </div>
          </div>

          <div className="mt-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-4 shadow-xl shadow-red-500/5"
              >
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold">{error}</p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Role */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-3">
                      How will you use KinetiK?
                    </h2>
                    <p className="text-slate-500 font-medium">
                      You can switch between these roles at any time later.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setRole("volunteer")}
                      className={`group p-8 rounded-[2rem] border-2 text-left transition-all duration-500 relative overflow-hidden ${role === "volunteer" ? "border-primary bg-white shadow-2xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]" : "border-slate-100 bg-white/50 hover:bg-white hover:border-slate-200 hover:shadow-xl"}`}
                    >
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${role === "volunteer" ? 'bg-primary text-white rotate-3' : 'bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                        <UserCheck className="h-7 w-7" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xl mb-2">
                        Volunteer
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Find events matching your skills and make a real impact.
                      </p>
                      {role === "volunteer" && (
                        <motion.div layoutId="activeRole" className="absolute top-4 right-4"><CheckCircle2 className="h-6 w-6 text-primary" /></motion.div>
                      )}
                    </button>

                    <button
                      onClick={() => setRole("organizer")}
                      className={`group p-8 rounded-[2rem] border-2 text-left transition-all duration-500 relative overflow-hidden ${role === "organizer" ? "border-primary bg-white shadow-2xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]" : "border-slate-100 bg-white/50 hover:bg-white hover:border-slate-200 hover:shadow-xl"}`}
                    >
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${role === "organizer" ? 'bg-primary text-white -rotate-3' : 'bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                        <Briefcase className="h-7 w-7" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xl mb-2">
                        Organizer
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Create events, discover talent, and track project growth.
                      </p>
                      {role === "organizer" && (
                        <motion.div layoutId="activeRole" className="absolute top-4 right-4"><CheckCircle2 className="h-6 w-6 text-primary" /></motion.div>
                      )}
                    </button>
                  </div>

                  <button
                    disabled={!role}
                    onClick={() => setStep(2)}
                    className="w-full mt-4 h-16 rounded-2xl bg-slate-900 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-5 w-5 translate-y-[1px]" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Info */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-3">
                      About yourself
                    </h2>
                    <p className="text-slate-500 font-medium">
                      Tell us what drives you.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        Short Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="I am a passionate builder..."
                        className="w-full p-6 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none h-40 text-slate-900 font-bold text-base shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, Country"
                          className="w-full pl-16 pr-6 h-16 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-slate-900 font-bold text-base shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 h-16 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
                    >
                      Back
                    </button>
                    <button
                      disabled={!bio.trim() || !location.trim()}
                      onClick={() => setStep(3)}
                      className="flex-1 h-16 rounded-2xl bg-slate-900 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Continue <ArrowRight className="h-5 w-5 translate-y-[1px]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Skills */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-3">
                      Your expertise
                    </h2>
                    <p className="text-slate-500 font-medium">
                      Add your skills to find the perfect projects.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="relative">
                        <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
                        <input
                          type="text"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={handleAddSkill}
                          onBlur={handleAddSkill}
                          placeholder="Type or select skills..."
                          className="w-full pl-16 pr-6 h-16 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-slate-900 font-bold text-base shadow-inner"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 ml-1">
                        {["React", "Python", "Design", "Marketing", "Event Planning"].map(s => (
                          <button key={s} onClick={() => !skills.includes(s) && setSkills([...skills, s])} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors border border-slate-100">
                             + {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-[120px] p-6 rounded-[1.5rem] border-2 border-dashed border-slate-100 flex flex-wrap gap-3 items-start content-start">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <motion.div
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={skill}
                            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black shadow-lg shadow-slate-900/10 group animate-in zoom-in-50"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              &times;
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-sm font-medium w-full text-center mt-6 uppercase tracking-widest text-[10px]">No skills added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-12 pt-10 border-t border-slate-100">
                    <button
                      onClick={() => setStep(2)}
                      className="px-8 h-16 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
                    >
                      Back
                    </button>
                    <button
                      disabled={isLoading || skills.length === 0}
                      onClick={completeOnboarding}
                      className="flex-1 h-16 rounded-2xl bg-primary text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        "Complete Setup"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
