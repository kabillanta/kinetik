/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User } from "firebase/auth";
import {
  Plus,
  Zap,
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Loader2,
  LayoutDashboard,
  Share2,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import CreateEventModal from "@/components/CreateEventModal";
import ConfirmModal from "@/components/ConfirmModal";
import StatCard from "@/components/StatCard";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

// --- Types ---
interface Event {
  id: string;
  title: string;
  role_needed: string;
  match_score: number;
  location: string;
  tech_stack: string[];
  current_volunteers?: number;
  volunteers_needed?: number;
}

// --- Helper Components ---
// StatCard imported from @/components/StatCard

// --- THE VOLUNTEER VIEW ---
const VolunteerDashboard = ({ user }: { user: User }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedEvents, setAppliedEvents] = useState<Set<string>>(new Set());
  const [selectedEventToApply, setSelectedEventToApply] = useState<Event | null>(null);
  const [stats, setStats] = useState({ reputation_score: 0, events_joined: 0, impact_hours: 0 });
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        // Parallel fetch: stats and recommendations
        const [statsRes, recRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/volunteers/${user.uid}/dashboard`, { headers }),
          fetch(`${API_BASE_URL}/api/recommendations/users/${user.uid}`, { headers })
        ]);
        
        if (statsRes.ok) {
          const d = await statsRes.json();
          if (d.stats) setStats(d.stats);
        }
        if (recRes.ok) {
          const d = await recRes.json();
          setEvents(d.data || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // Search-triggered re-fetch (debounced)
  useEffect(() => {
    if (!user || !searchQuery.trim()) return;
    
    const fetchFilteredEvents = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const url = `${API_BASE_URL}/api/recommendations/users/${user.uid}?search_query=${encodeURIComponent(searchQuery.trim())}`;
        const recRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (recRes.ok) {
          const d = await recRes.json();
          setEvents(d.data || []);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayTimer = setTimeout(fetchFilteredEvents, 400);
    return () => clearTimeout(delayTimer);
  }, [user, searchQuery]);

  const handleApply = async () => {
    if (!user || !selectedEventToApply) return;
    const eventId = selectedEventToApply.id;
    setApplying(eventId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: user.displayName || "Volunteer" }),
        }
      );
      if (res.ok) {
        setAppliedEvents(prev => new Set(prev).add(eventId));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, current_volunteers: (e.current_volunteers || 0) + 1 } : e));
        setSelectedEventToApply(null);
        toast("Application submitted successfully!", "success");
      } else {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        toast(err.detail || "Failed to apply", "error");
      }
    } catch (err) {
      console.error("Apply failed:", err);
      toast("Network error — please try again", "error");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div>
          <h1 className="text-4xl font-semibold text-black tracking-tight flex items-center gap-3">
            Volunteer HQ{" "}
            <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-bold tracking-widest uppercase">
              BETA
            </span>
          </h1>
          <p className="text-[#86868B] mt-2 text-lg font-medium">
            Welcome back, {user?.displayName || "Volunteer"}. Let's make an
            impact today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (user) {
                navigator.clipboard.writeText(`${window.location.origin}/u/${user.uid}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[#1D1D1F] hover:bg-zinc-50 transition-all border border-black/[0.08] shadow-sm font-medium"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />} 
            {copied ? "Copied Link" : "Share Profile"}
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[#1D1D1F] hover:bg-zinc-50 transition-all border border-black/[0.08] shadow-sm font-medium"
          >
            <LayoutDashboard className="h-4 w-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Reputation Score" value={stats.reputation_score} icon={Zap} />
          <StatCard label="Events Joined" value={stats.events_joined} icon={Calendar} />
          <StatCard label="Impact Hours" value={`${stats.impact_hours}h`} icon={Users} />
      </div>
      
      {/* Dynamic AI Recommendations */}
      <div className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-black flex items-center gap-2 tracking-tight">
            <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            Recommended for You
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search explicitly by title, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-black/[0.06] focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[14px] font-medium shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 w-full rounded-2xl bg-white animate-pulse border border-black/[0.04]"
              />
            ))
          ) : events.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-black/[0.08] rounded-3xl bg-white text-[#86868B]">
              <div className="mb-2 font-semibold text-xl text-black">
                No matches found yet.
              </div>
              <div className="text-base">
                Try adding more skills to your profile to get personalized
                recommendations.
              </div>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl border border-black/[0.04] bg-white hover:shadow-lg transition-all gap-6 duration-300"
              >
                <div className="flex items-start gap-6">
                  {/* Event Icon Placeholder */}
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-zinc-100 to-zinc-200 flex items-center justify-center text-zinc-500 font-bold border border-black/[0.04] shrink-0 text-xl">
                    {event.title.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-black group-hover:text-blue-600 transition-colors tracking-tight">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#86868B] mt-1.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="h-4 w-4" /> {event.role_needed}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {event.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {event.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs font-medium bg-black/[0.04] px-3 py-1.5 rounded-lg text-[#1D1D1F]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pl-0 md:pl-6 border-t md:border-t-0 border-black/[0.04] pt-5 md:pt-0 w-full md:w-auto">
                    <div className="flex items-center gap-4">
                      {event.current_volunteers !== undefined && (
                        <div className="text-right hidden sm:block mr-2">
                          <div className="text-[10px] text-[#86868B] uppercase font-bold tracking-widest mb-1.5">
                            Volunteers
                          </div>
                          <span className="text-sm font-semibold text-black">
                            <Users className="h-4 w-4 inline mr-1 text-[#86868B]" />
                            {event.current_volunteers}/{event.volunteers_needed || 5}
                          </span>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-[10px] text-[#86868B] uppercase font-bold tracking-widest mb-1.5">
                          Fit Score
                        </div>
                        <span className="text-sm font-bold font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-block">
                          {Math.round(event.match_score * 100)}%
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="h-12 px-6 rounded-full flex items-center justify-center bg-zinc-100 text-[#1D1D1F] hover:bg-zinc-200 transition-all font-medium text-sm shadow-sm border border-black/[0.04]"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => !appliedEvents.has(event.id) && setSelectedEventToApply(event)}
                        disabled={appliedEvents.has(event.id) || applying === event.id}
                    className={`h-12 px-6 rounded-full flex items-center justify-center transition-all shadow-md font-medium text-sm
                      ${appliedEvents.has(event.id) ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:scale-105 hover:bg-blue-600'}
                      ${applying === event.id ? 'opacity-75 cursor-not-allowed' : ''}
                    `}
                  >
                    {applying === event.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : appliedEvents.has(event.id) ? (
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Applied</span>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={!!selectedEventToApply}
          onClose={() => setSelectedEventToApply(null)}
          onConfirm={handleApply}
          title="Confirm Application"
          message={selectedEventToApply ? `Are you sure you want to apply for "${selectedEventToApply.title}" as a ${selectedEventToApply.role_needed}?` : ""}
          confirmText="Confirm Apply"
          cancelText="Cancel"
          loading={applying === selectedEventToApply?.id}
        />
    </div>
  );
};

// --- 3. MAIN PAGE (TRAFFIC CONTROLLER) ---
export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZER" | null>(null);

  useEffect(() => {
    if (userProfile?.role) {
      const normalizedRole = userProfile.role.toUpperCase() as "VOLUNTEER" | "ORGANIZER";
      setRole(normalizedRole);
      localStorage.setItem("kinetik_user_role", normalizedRole);
    } else {
      const storedRole = localStorage.getItem("kinetik_user_role");
      if (storedRole) {
        setRole(storedRole.toUpperCase() as "VOLUNTEER" | "ORGANIZER");
      } else {
        setRole("VOLUNTEER");
      }
    }
  }, [userProfile]);

  // Redirect organizers to their dedicated dashboard
  useEffect(() => {
    if (role === "ORGANIZER") {
      router.replace("/organizer/dashboard");
    }
  }, [role, router]);

  if (!role || role === "ORGANIZER") return null;

  return (
    <div className="w-full text-slate-50 relative z-10">
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <VolunteerDashboard user={user!} />
      </div>
    </div>
  );
}


