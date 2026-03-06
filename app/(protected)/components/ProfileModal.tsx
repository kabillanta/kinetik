"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Sparkles, MapPin, AlertCircle } from "lucide-react";

export function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, userProfile, refreshProfile } = useAuth();

  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // New field for profile image URL
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userProfile && isOpen) {
      setBio(userProfile.bio || "");
      setLocation(userProfile.location || "");
      setImageUrl(userProfile.imageUrl || ""); // Populate image URL
      setSkills(userProfile.skills || []);
      setError("");
    }
  }, [userProfile, isOpen]);

  if (!isOpen || !user || !userProfile) return null;

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

  const saveProfile = async () => {
    setIsLoading(true);
    setError("");

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        bio,
        location,
        imageUrl,
        skills,
      });

      await refreshProfile();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/[0.04] overflow-hidden zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/[0.04]">
          <h2 className="text-2xl font-semibold text-black tracking-tight">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Short Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I'm a passionate developer..."
              className="w-full p-4 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none h-32 text-black font-medium text-sm"
            />
            {/* Profile Image URL */}
            <label className="block text-sm font-semibold text-black mb-2 mt-4">
              Profile Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full p-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Location
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

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Skills
            </label>
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
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium"
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/[0.04] bg-zinc-50/50 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-semibold text-[#1D1D1F] hover:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-black text-white font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
