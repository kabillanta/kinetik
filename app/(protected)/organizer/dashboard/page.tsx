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
import ConfirmModal from "@/components/ConfirmModal";
import StatCard from "@/components/StatCard";
import { User } from "firebase/auth";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

// Type definitions
interface Application {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  event_id: string;
  event_title: string;
  status: string;
  applied_at?: string;
  skills?: string[];
}

interface RecentEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  applicant_count: number;
  role?: string;
  location?: string;
  skills?: string[];
}

interface DashboardData {
  stats: { active_events: number; pending_applications: number; total_volunteers: number };
  applications: Application[];
  recent_events?: RecentEvent[];
}

// --- 2. THE ORGANIZER VIEW ---
const OrganizerDashboard = ({
  user,
}: {
  user: User | null;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [completingEvent, setCompletingEvent] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "complete";
    eventId: string;
    eventTitle: string;
  }>({ isOpen: false, type: "delete", eventId: "", eventTitle: "" });
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

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    setDeletingEvent(eventId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDashboardData(prev => prev ? {
          ...prev,
          recent_events: prev.recent_events?.filter(e => e.id !== eventId),
          stats: { ...prev.stats, active_events: Math.max(0, prev.stats.active_events - 1) }
        } : null);
        toast("Event deleted", "success");
      }
    } catch (error) {
      toast("Error deleting event", "error");
    } finally {
      setDeletingEvent(null);
      setConfirmModal({ isOpen: false, type: "delete", eventId: "", eventTitle: "" });
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    if (!user) return;
    setCompletingEvent(eventId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDashboardData(prev => prev ? {
          ...prev,
          recent_events: prev.recent_events?.map(e => e.id === eventId ? { ...e, status: "COMPLETED" } : e),
          stats: { ...prev.stats, active_events: Math.max(0, prev.stats.active_events - 1) }
        } : null);
        toast("Event completed!", "success");
      }
    } catch (error) {
      toast("Error completing event", "error");
    } finally {
      setCompletingEvent(null);
      setConfirmModal({ isOpen: false, type: "complete", eventId: "", eventTitle: "" });
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
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Header - Clean & Minimal */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Dashboard</p>
          <h1 className="text-4xl font-bold text-black tracking-tight">
            Organizer
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2.5 bg-black text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
          New Event
        </button>
      </header>

      {/* Stats - Minimal Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-zinc-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-3xl font-bold text-black tabular-nums">
            {dashboardData?.stats?.active_events || 0}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Events</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-zinc-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-3xl font-bold text-black tabular-nums">
            {dashboardData?.stats?.pending_applications || 0}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Applications</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-zinc-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-bold text-black tabular-nums">
            {dashboardData?.stats?.total_volunteers || 0}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Volunteers</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications Column - Takes 2/3 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black">Pending Applications</h2>
            {!loading && dashboardData?.applications && dashboardData.applications.length > 0 && (
              <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
                {dashboardData.applications.length} pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-zinc-100 animate-pulse" />
              ))
            ) : !dashboardData?.applications || dashboardData.applications.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 mb-4">
                  <Users className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-zinc-900 font-semibold mb-1">No applications</p>
                <p className="text-sm text-zinc-500">New applications will appear here</p>
              </div>
            ) : (
              dashboardData.applications.map((app, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {app.volunteer_name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-black truncate">{app.volunteer_name}</h3>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            for <span className="text-black font-medium">{app.event_title}</span>
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, "ACCEPTED")}
                            disabled={actionLoading === `${app.event_id}-${app.volunteer_id}-ACCEPTED`}
                            className="h-9 w-9 rounded-lg bg-black hover:bg-zinc-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Accept"
                          >
                            {actionLoading === `${app.event_id}-${app.volunteer_id}-ACCEPTED` ? (
                              <Loader2 className="h-4 w-4 text-white animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, "REJECTED")}
                            disabled={actionLoading === `${app.event_id}-${app.volunteer_id}-REJECTED`}
                            className="h-9 w-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject"
                          >
                            {actionLoading === `${app.event_id}-${app.volunteer_id}-REJECTED` ? (
                              <Loader2 className="h-4 w-4 text-zinc-600 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 text-zinc-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Skills */}
                      {app.skills && app.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {app.skills.map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[11px] font-medium bg-zinc-100 px-2.5 py-1 rounded-md text-zinc-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Events Column - Takes 1/3 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black">Your Events</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-zinc-100 animate-pulse" />
              ))
            ) : !dashboardData?.recent_events || dashboardData.recent_events.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 mb-4">
                  <Calendar className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-zinc-900 font-semibold mb-2">No events</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  Create your first →
                </button>
              </div>
            ) : (
              dashboardData.recent_events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 transition-all"
                >
                  {/* Event Info */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-black leading-snug">{ev.title}</h3>
                      {ev.status === "COMPLETED" && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md uppercase">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {ev.role}
                      </span>
                      {ev.location && (
                        <>
                          <span>•</span>
                          <span>{ev.location}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Skills */}
                  {ev.skills && ev.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {ev.skills.slice(0, 3).map((s: string) => (
                        <span
                          key={s}
                          className="text-[10px] font-medium bg-zinc-100 px-2 py-0.5 rounded text-zinc-600"
                        >
                          {s}
                        </span>
                      ))}
                      {ev.skills.length > 3 && (
                        <span className="text-[10px] font-medium text-zinc-400">
                          +{ev.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-zinc-100">
                    {ev.status !== "COMPLETED" && (
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: "complete",
                          eventId: ev.id,
                          eventTitle: ev.title
                        })}
                        disabled={completingEvent === ev.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completingEvent === ev.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Complete
                      </button>
                    )}

                    {/* Animated Delete Button */}
                    <button
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        type: "delete",
                        eventId: ev.id,
                        eventTitle: ev.title
                      })}
                      disabled={deletingEvent === ev.id}
                      className={`group relative overflow-hidden ${ev.status === "COMPLETED" ? 'flex-1' : ''} flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200 hover:border-red-200 hover:bg-red-50 text-zinc-500 hover:text-red-600`}
                    >
                      {deletingEvent === ev.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12" />
                      )}
                      <span className="relative">
                        Delete
                        <span className="absolute inset-x-0 bottom-0 h-px bg-red-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchDashboard()}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "delete", eventId: "", eventTitle: "" })}
        onConfirm={() => {
          if (confirmModal.type === "delete") {
            handleDeleteEvent(confirmModal.eventId);
          } else {
            handleCompleteEvent(confirmModal.eventId);
          }
        }}
        title={confirmModal.type === "delete" ? "Delete Event" : "Complete Event"}
        message={
          confirmModal.type === "delete"
            ? `Are you sure you want to permanently delete "${confirmModal.eventTitle}"? This action cannot be undone.`
            : `Mark "${confirmModal.eventTitle}" as completed? This will close the event for new applications.`
        }
        confirmText={confirmModal.type === "delete" ? "Delete Event" : "Mark Complete"}
        cancelText="Cancel"
        variant={confirmModal.type === "delete" ? "danger" : "default"}
        loading={confirmModal.type === "delete" ? deletingEvent === confirmModal.eventId : completingEvent === confirmModal.eventId}
      />

      {/* Mobile FAB for Create Event */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full bg-black text-white shadow-lg shadow-black/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50"
        aria-label="Create new event"
      >
        <Plus className="h-6 w-6" />
      </button>
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
