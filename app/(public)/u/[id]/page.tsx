"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Briefcase, Award, ArrowLeft, Loader2, Sparkles, CheckCircle2, Share2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import Image from "next/image";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/users/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Profile not found");
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchProfile();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-20 w-20 bg-zinc-200 rounded-full flex items-center justify-center mb-6">
          <Briefcase className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Profile Not Found</h1>
        <p className="text-[#86868B] mb-8">{error || "This user doesn't exist or has hidden their profile."}</p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-white font-medium hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to KinetiK
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* Mini Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-black/[0.04] flex items-center px-6 z-50 justify-between">
        <button onClick={() => router.push("/")} className="font-bold text-xl tracking-tight text-black flex items-center gap-2">
          <div className="h-8 w-8 bg-black text-white rounded-lg flex items-center justify-center text-sm">K</div>
          <span className="hidden sm:inline">KinetiK</span>
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 text-sm font-medium text-[#1D1D1F] bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-all">
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          {copied ? "Copied Link" : "Share Profile"}
        </button>
      </header>

      <div className="pt-28 px-4 md:px-8 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Main Cover / Info Card */}
        <div className="bg-white rounded-[2rem] border border-black/[0.04] shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
          
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 mb-6">
              <div className="h-24 w-24 rounded-2xl border-4 border-white bg-zinc-100 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                {profile.photo_url ? (
                  <Image src={profile.photo_url} alt={profile.name} width={96} height={96} className="object-cover h-full w-full" />
                ) : (
                  <span className="text-3xl font-bold text-zinc-400">{profile.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black tracking-tight">{profile.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#86868B] font-medium">
                  {profile.role && <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</div>}
                  {profile.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.location}</div>}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-[15px] leading-relaxed text-[#1D1D1F] max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] p-8 border border-black/[0.04] shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest text-[#86868B] uppercase mb-1">Projects</div>
              <div className="text-4xl font-semibold text-black tracking-tight">{profile.events_completed || 0}</div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-black/[0.04] shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest text-[#86868B] uppercase mb-1">Impact Hours</div>
              <div className="text-4xl font-semibold text-black tracking-tight">{profile.impact_hours || 0}</div>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div className="bg-white rounded-[2rem] p-8 border border-black/[0.04] shadow-sm">
          <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" /> Superpowers
          </h2>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span key={skill} className="px-4 py-2 rounded-xl bg-zinc-100 text-[#1D1D1F] font-semibold text-sm">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[#86868B] font-medium">No skills added yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
