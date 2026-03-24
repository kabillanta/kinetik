/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  Trash2,
  Loader2,
  Users,
  Calendar,
  Plus
} from "lucide-react";
import CreateEventModal from "@/components/CreateEventModal";
import StatCard from "@/components/StatCard";
import { User } from "firebase/auth";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

// StatCard imported from @/components/StatCard

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applications: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recent_events?: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [completingEvent, setCompletingEvent] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApplicationAction = async (eventId: string, volunteerId: string, status: "ACCEPTED" | "REJECTED") => {
    const actionKey = `${eventId}-${volunteerId}-${status}`;
    setActionLoading(actionKey);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/applications/${volunteerId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDashboardData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            applications: prev.applications.filter((app: any) => app.volunteer_id !== volunteerId || app.event_id !== eventId)
          };
        });
      }
    } catch (error) {
      console.error(`Failed to ${status} application:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchDashboard = useCallback(async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_BASE_URL}/api/organizers/${user.uid}/dashboard`,
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
              BETA
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
                      <button onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, "ACCEPTED")} className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, "REJECTED")} className="p-2.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm">
                        <XCircle className="h-5 w-5" />
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
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs font-semibold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                          {ev.date || "No date"}
                        </div>
                        <button
                          onClick={async () => {
                            if (!user) return;
                            if (!confirm("Are you sure you want to delete this event? This will also remove all applications for it.")) return;
                            setDeletingEvent(ev.id);
                            try {
                              const token = await user.getIdToken();
                              const res = await fetch(`${API_BASE_URL}/api/events/${ev.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                setDashboardData(prev => prev ? {
                                  ...prev,
                                  recent_events: prev.recent_events?.filter(e => e.id !== ev.id),
                                  stats: { ...prev.stats, active_events: Math.max(0, prev.stats.active_events - 1) }
                                } : null);
                                toast("Event deleted successfully", "success");
                              } else {
                                toast("Failed to delete event", "error");
                              }
                            } catch (error) {
                              toast("Network error while deleting", "error");
                            } finally {
                              setDeletingEvent(null);
                            }
                          }}
                          disabled={deletingEvent === ev.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingEvent === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                        {ev.status !== "COMPLETED" ? (
                          <button
                            onClick={async () => {
                              if (!user) return;
                              if (!confirm("Are you sure you want to mark this event as completed? This will permanently award impact hours to accepted volunteers.")) return;
                              setCompletingEvent(ev.id);
                              try {
                                const token = await user.getIdToken();
                                const res = await fetch(`${API_BASE_URL}/api/events/${ev.id}/complete`, {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  setDashboardData(prev => prev ? {
                                    ...prev,
                                    recent_events: prev.recent_events?.map(e => e.id === ev.id ? { ...e, status: "COMPLETED" } : e),
                                    stats: { ...prev.stats, active_events: Math.max(0, prev.stats.active_events - 1) }
                                  } : null);
                                  toast("Event marked as completed!", "success");
                                } else {
                                  toast("Failed to mark completed", "error");
                                }
                              } catch (error) {
                                toast("Network error", "error");
                              } finally {
                                setCompletingEvent(null);
                              }
                            }}
                            disabled={completingEvent === ev.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {completingEvent === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Mark Complete
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-500 bg-zinc-100/80 rounded-lg">
                            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" /> Completed
                          </span>
                        )}
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

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <OrganizerDashboard user={user} />
    </div>
  );
}
