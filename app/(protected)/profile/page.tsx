/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { Camera, MapPin, Sparkles, AlertCircle, Loader2, Save, User as UserIcon, Mail, Briefcase, ChevronRight, Link as LinkIcon, Github, Linkedin, Clock, Star } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api-config";
import { StarRating, ReviewCard } from "@/components/ui/ReviewModal";

interface ReviewStats {
  average_rating: number;
  review_count: number;
  rating_distribution: { [key: number]: number };
}

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  event_title: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [availability, setAvailability] = useState("Available for opportunities");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  // Review stats state
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchReviewData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      
      // Fetch review stats
      const statsRes = await fetch(`${API_BASE_URL}/api/reviews/users/${user.uid}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch recent reviews
      const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/users/${user.uid}?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setReviewStats(statsData);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch review data:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  useEffect(() => {
    if (userProfile || user) {
      setDisplayName(userProfile?.displayName || user?.displayName || "");
      setHeadline(userProfile?.headline || "");
      setBio(userProfile?.bio || "");
      setLocation(userProfile?.location || "");
      setImageUrl(userProfile?.imageUrl || user?.photoURL || "");
      setSkills(userProfile?.skills || []);
      setPortfolioUrl(userProfile?.portfolioUrl || "");
      setLinkedInUrl(userProfile?.linkedInUrl || "");
      setGithubUrl(userProfile?.githubUrl || "");
      setAvailability(userProfile?.availability || "Available for opportunities");
    }
  }, [userProfile, user]);

  useEffect(() => {
    fetchReviewData();
  }, [fetchReviewData]);

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
    setShowImageInput(!showImageInput);
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const token = await user.getIdToken();
      const payload = {
        displayName,
        headline,
        bio,
        location,
        imageUrl,
        skills,
        portfolioUrl,
        linkedInUrl,
        githubUrl,
        availability,
      };

      const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      await refreshProfile();
      toast("Profile updated successfully!", "success");
    } catch (e: any) {
      console.error("Error updating profile:", e);
      toast("Failed to update profile. Please try again.", "error");
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
              Manage your personal information, skills, and professional links.
            </p>
          </div>
          <button
            onClick={saveProfile}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-white hover:bg-zinc-800 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
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
          <div className="h-32 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-black"></div>
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
                  <p className="text-zinc-500 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Briefcase className="h-4 w-4" />
                    {headline || "Role / Title"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showImageInput && (
            <div className="px-6 md:px-10 -mt-2 pb-4 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-1.5 ml-0.5">
                Profile Image URL
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                />
                <button
                  onClick={() => setShowImageInput(false)}
                  className="px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
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
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
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
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
               <h3 className="text-lg font-bold text-black mb-5 tracking-tight flex items-center gap-2">
                 <LinkIcon className="h-5 w-5 text-zinc-400" />
                 Links
               </h3>
               
               <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    Portfolio / Website
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    GitHub Profile
                  </label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-0.5">
                    LinkedIn Profile
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500/60" />
                    <input
                      type="url"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                    />
                  </div>
                </div>
               </div>
            </div>

            {/* Reviews & Ratings Section */}
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-black mb-5 tracking-tight flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Reviews & Ratings
              </h3>
              
              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : reviewStats && reviewStats.review_count > 0 ? (
                <div className="space-y-6">
                  {/* Rating Summary */}
                  <div className="flex items-center gap-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-amber-600">
                        {reviewStats.average_rating.toFixed(1)}
                      </p>
                      <StarRating rating={reviewStats.average_rating} size="sm" />
                      <p className="text-xs text-zinc-500 mt-1">
                        {reviewStats.review_count} review{reviewStats.review_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.rating_distribution[star] || 0;
                        const percentage = reviewStats.review_count > 0 
                          ? (count / reviewStats.review_count) * 100 
                          : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-zinc-500">{star}</span>
                            <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-6 text-zinc-400 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {reviews.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-zinc-600">Recent Reviews</p>
                      {reviews.slice(0, 3).map((review) => (
                        <ReviewCard
                          key={review.id}
                          reviewerName={review.reviewer_name}
                          rating={review.rating}
                          comment={review.comment}
                          date={review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                          eventTitle={review.event_title}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-black/[0.08] rounded-2xl text-center">
                  <Star className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm font-medium">No reviews yet</p>
                  <p className="text-zinc-400 text-xs mt-1">Complete events to receive reviews from organizers</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Deep Details & Skills */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-black tracking-tight">About You</h3>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-black/5">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <select 
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
                  >
                    <option value="Available for opportunities">Available for opportunities</option>
                    <option value="Open to collaborations">Open to collaborations</option>
                    <option value="Currently busy">Currently busy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 ml-0.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little bit about yourself, your background, and what you're interested in..."
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none min-h-[140px] text-black font-medium text-sm leading-relaxed"
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
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-black font-medium text-sm"
                />

                {skills.length === 0 ? (
                  <div className="mt-6 p-6 border-2 border-dashed border-black/[0.08] rounded-2xl text-center">
                    <p className="text-zinc-500 text-sm font-medium">No skills added yet. Add some skills to match with better opportunities!</p>
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
