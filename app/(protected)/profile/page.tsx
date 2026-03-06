"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Camera, MapPin, Sparkles, AlertCircle, Loader2, Save, User as UserIcon, Mail, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile || user) {
      setDisplayName(userProfile?.displayName || user?.displayName || "");
      setBio(userProfile?.bio || "");
      setLocation(userProfile?.location || "");
      setImageUrl(userProfile?.imageUrl || user?.photoURL || "");
      setSkills(userProfile?.skills || []);
    }
  }, [userProfile, user]);

  const handleAddSkill = (
    e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>
  ) => {
    if (
      (e.type === "keydown" && (e as React.KeyboardEvent).key === "Enter") ||
      e.type === "blur"
    ) {
      e.preventDefault();
      const val = currentSkill.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
        setCurrentSkill("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleImageUrlChange = () => {
    const url = prompt("Enter a direct link to your profile image:");
    if (url) {
      setImageUrl(url);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Update Firebase
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        displayName,
        bio,
        location,
        imageUrl,
        skills,
      });

      // 2. Update Neo4j Backend synchronously
      try {
        await fetch('http://localhost:8000/api/users/skills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          body: JSON.stringify(skills)
        });
      } catch (backendErr) {
        console.warn('Failed to sync skills with Neo4j backend', backendErr);
        // We don't fail the whole profile save if just the recommendation engine is down
      }

      await refreshProfile();
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-6">
        <div className="flex items-center text-sm font-medium text-zinc-500 mb-2">
          <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-black">Profile</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-3">
              Profile Settings
            </h1>
            <p className="text-[#86868B] mt-1 font-medium">
              Manage your personal information, skills, and preferences.
            </p>
          </div>
          <button
            onClick={saveProfile}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-white hover:bg-zinc-800 transition-all shadow-md font-medium disabled:opacity-50 h-[42px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="rounded-3xl border border-black/[0.04] bg-white shadow-sm overflow-hidden">
          {/* Cover Photo Area */}
          <div className="h-32 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={handleImageUrlChange}
                  title="Change Profile Picture"
                >
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-zinc-100 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-12 w-12 text-zinc-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="text-center sm:text-left mb-2 sm:mb-0">
                  <h2 className="text-2xl font-bold text-black tracking-tight">{displayName || "Your Name"}</h2>
                  <p className="text-zinc-500 font-medium capitalize flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Briefcase className="h-4 w-4" />
                    {userProfile.role || "Volunteer"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Left Column - Core Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-black mb-5 tracking-tight flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-zinc-400" />
                Basic Info
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-100 border border-black/[0.04] text-zinc-500 font-medium text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 ml-0.5">Email cannot be changed.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Deep Details & Skills */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-black mb-5 tracking-tight">About You</h3>
              <div>
                <label className="block text-sm font-semibold text-black mb-2 ml-0.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little bit about yourself, what you love doing, and what you're looking for..."
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none min-h-[140px] text-black font-medium text-sm leading-relaxed"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />
                  Skills & Technologies
                </h3>
              </div>
              
              <div>
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  onBlur={handleAddSkill}
                  placeholder="Type a skill and press Enter (e.g. React, UI Design, Marketing)..."
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                />
                
                {skills.length === 0 ? (
                  <div className="mt-6 p-6 border-2 border-dashed border-black/[0.08] rounded-2xl text-center">
                    <p className="text-zinc-500 text-sm font-medium">No skills added yet. Add some skills to match with better events!</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 pt-5">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="group flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold shadow-sm hover:border-black hover:text-black transition-all"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="h-5 w-5 rounded-md text-zinc-400 group-hover:text-black hover:bg-zinc-100 flex items-center justify-center transition-colors"
                          title={`Remove ${skill}`}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
