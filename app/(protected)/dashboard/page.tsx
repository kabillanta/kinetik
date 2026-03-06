/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import CreateEventModal from "@/components/CreateEventModal";

// --- Types ---
interface Event {
  id: string;
  title: string;
  role_needed: string;
  match_score: number;
  location: string;
  tech_stack: string[];
  current_volunteers?: number;
}

// --- Helper Components ---
function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="p-6 rounded-2xl border border-black/[0.04] bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[#86868B] text-xs uppercase tracking-widest font-semibold">
          {label}
        </div>
        {Icon && (
          <div className="p-2 bg-black/[0.03] rounded-xl text-black">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="text-4xl font-semibold text-black tracking-tight">
        {value}
      </div>
    </div>
  );
}

// --- THE VOLUNTEER VIEW ---
const VolunteerDashboard = ({
  user,
}: {
  user: User | null;
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedEvents, setAppliedEvents] = useState<Set<string>>(new Set());
  const [selectedEventToApply, setSelectedEventToApply] = useState<Event | null>(null);
  const [stats, setStats] = useState({ reputation_score: 850, events_joined: 0, impact_hours: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        const token = await user.getIdToken();

        // Fetch recommendations
        const recRes = await fetch(
          `http://localhost:8000/api/recommendations/users/${user.uid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (recRes.ok) {
          const json = await recRes.json();
          setEvents(json.data || []);
        }

        // Fetch stats
        const statsRes = await fetch(
          `http://localhost:8000/api/volunteers/${user.uid}/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (statsRes.ok) {
          const json = await statsRes.json();
          if (json.stats) setStats(json.stats);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleApply = async () => {
    if (!user || !selectedEventToApply) return;
    const eventId = selectedEventToApply.id;
    setApplying(eventId);
    try {
      const res = await fetch(
        `http://localhost:8000/api/events/${eventId}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user.uid,
          },
          body: JSON.stringify({ name: user.displayName || "Volunteer" }),
        }
      );
      if (res.ok) {
        setAppliedEvents(prev => new Set(prev).add(eventId));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, current_volunteers: (e.current_volunteers || 0) + 1 } : e));
        setSelectedEventToApply(null);
      }
    } catch (err) {
      console.error("Apply failed:", err);
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
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[#1D1D1F] hover:bg-zinc-50 transition-all border border-black/[0.08] shadow-sm font-medium"
          >
            <LayoutDashboard className="h-4 w-4" /> Edit Profile
          </button>
          <button className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-white hover:bg-zinc-800 transition-all shadow-md font-medium">
            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />{" "}
            Available for gigs
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
        <h2 className="text-2xl font-semibold text-black mb-6 flex items-center gap-2 tracking-tight">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          Recommended for You
        </h2>

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
                            {event.current_volunteers}
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
        {selectedEventToApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-black mb-2">Confirm Application</h3>
              <p className="text-[#86868B] mb-6">
                Are you sure you want to apply for the <span className="font-semibold text-black">"{selectedEventToApply.title}"</span> event as a <span className="font-semibold text-black">{selectedEventToApply.role_needed}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEventToApply(null)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-black font-semibold rounded-xl transition-all"
                  disabled={applying === selectedEventToApply.id}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center"
                  disabled={applying === selectedEventToApply.id}
                >
                  {applying === selectedEventToApply.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Confirm Apply"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

// --- 2. THE ORGANIZER VIEW ---
const OrganizerDashboard = ({
  user,
}: {
  user: User | null;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<{
    stats: { active_events: number; pending_applications: number; total_volunteers: number };
    applications: any[];
    recent_events?: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(
        `http://localhost:8000/api/organizers/${user.uid}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const json = await res.json();
        setDashboardData(json);
      }
    } catch (error) {
      console.error("Failed to fetch organizer dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user, fetchDashboard]);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div>
          <h1 className="text-4xl font-semibold text-black tracking-tight flex items-center gap-3">
            Organizer Panel{" "}
            <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full tracking-widest font-bold uppercase">
              PRO
            </span>
          </h1>
          <p className="text-[#86868B] mt-2 text-lg font-medium">
            Manage your events and recruit top talent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[#1D1D1F] hover:bg-zinc-50 transition-all border border-black/[0.08] shadow-sm font-medium"
          >
            <LayoutDashboard className="h-4 w-4" /> Edit Profile
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-white hover:bg-zinc-800 shadow-md transition-all font-medium"
          >
            <Plus className="h-4 w-4" /> Create Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Events" value={dashboardData?.stats?.active_events || 0} icon={Calendar} />
        <StatCard label="Pending Applications" value={dashboardData?.stats?.pending_applications || 0} icon={Users} />
        <StatCard label="Total Volunteers" value={dashboardData?.stats?.total_volunteers || 0} icon={CheckCircle2} />
      </div>

      {/* Recent Activity / Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        <div>
          <h2 className="text-2xl font-semibold text-black mb-6 tracking-tight">
            Pending Applications
          </h2>
          <div className="grid gap-4">
            {loading ? (
               [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 w-full rounded-2xl bg-white animate-pulse border border-black/[0.04]"
                  />
                ))
            ) : !dashboardData?.applications || dashboardData.applications.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-black/[0.08] rounded-3xl bg-white text-[#86868B]">
                <div className="mb-2 font-semibold text-xl text-black">
                  No applications yet.
                </div>
                <div className="text-base">
                  Create more events to attract volunteers.
                </div>
              </div>
            ) : (
              dashboardData.applications.map((app, idx) => (
                <div key={idx} className="group p-6 rounded-3xl border border-black/[0.04] bg-white hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-lg font-bold text-black">
                        {app.volunteer_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-black text-xl tracking-tight">
                          {app.volunteer_name}
                        </h3>
                        <p className="text-sm text-[#86868B] font-medium mt-0.5">
                          Applied for:{" "}
                          <span className="text-black">{app.event_title}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 pl-0 sm:pl-[76px]">
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-black/[0.03]">
                      <div className="flex flex-wrap gap-2 mt-2">
                        <p className="text-[14px] text-[#1D1D1F] leading-relaxed mr-2 font-semibold">Skills:</p>
                        {app.skills.map((skill: string) => (
                          <span key={skill} className="text-xs font-medium bg-black/[0.04] px-3 py-1.5 rounded-lg text-[#1D1D1F]">
                            {skill}
                          </span>
                        ))}
                      </div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
           <h2 className="text-2xl font-semibold text-black mb-6 tracking-tight">
             Your Recent Events
           </h2>
           <div className="grid gap-4">
             {loading ? (
                [1, 2].map((i) => (
                   <div key={i} className="h-24 w-full rounded-2xl bg-white animate-pulse border border-black/[0.04]" />
                ))
             ) : !dashboardData?.recent_events || dashboardData.recent_events.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-black/[0.08] rounded-3xl bg-white text-[#86868B]">
                  <div className="mb-2 font-semibold text-xl text-black">No events posted.</div>
                  <div className="text-base transform transition-all hover:scale-105 cursor-pointer text-blue-500 font-medium" onClick={() => setIsModalOpen(true)}>
                    Create one now &rarr;
                  </div>
                </div>
             ) : (
                dashboardData.recent_events.map((ev) => (
                  <div key={ev.id} className="group p-5 rounded-3xl border border-black/[0.04] bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-black">{ev.title}</h3>
                        <p className="text-sm text-[#86868B] font-medium mt-1 mb-3">Role: {ev.role} • {ev.location}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ev.skills.map((s: string) => (
                            <span key={s} className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded-md text-zinc-600 uppercase tracking-wider">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                        {ev.date || "No date"}
                      </div>
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
    </div>
  );
};

// --- 3. MAIN PAGE (TRAFFIC CONTROLLER) ---
export default function DashboardPage() {
  const { user } = useAuth(); // Removed 'logout' as it's not used here
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZER" | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("kinetik_user_role");
    setRole((storedRole as "VOLUNTEER" | "ORGANIZER") || "VOLUNTEER");
  }, []);

  if (!role) return null;

  return (
    <div className="w-full text-slate-50 relative z-10">
      {/* Content Area */}
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {role === "VOLUNTEER" ? (
          <VolunteerDashboard user={user} />
        ) : (
          <OrganizerDashboard user={user} />
        )}
      </div>
    </div>
  );
}
