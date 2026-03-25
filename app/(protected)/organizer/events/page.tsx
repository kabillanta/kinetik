/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CheckCircle,
  User
} from "lucide-react";
import CreateEventModal from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

interface Application {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_photo?: string;
  skills: string[];
  status: string;
  applied_at?: string;
}

interface EventWithApplications {
  id: string;
  title: string;
  date: string;
  location: string;
  role: string;
  skills: string[];
  volunteersFilled: number;
  volunteersTotal: number;
  status: string;
  applications: Application[];
}

export default function OrganizerEvents() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<EventWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [completingEvent, setCompletingEvent] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      // Fetch events
      const eventsRes = await fetch(
        `${API_BASE_URL}/api/organizers/${user.uid}/events`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch dashboard for applications
      const dashboardRes = await fetch(
        `${API_BASE_URL}/api/organizers/${user.uid}/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (eventsRes.ok && dashboardRes.ok) {
        const eventsJson = await eventsRes.json();
        const dashboardJson = await dashboardRes.json();
        
        // Merge applications into events
        const eventsWithApps = (eventsJson.events || []).map((ev: any) => {
          const eventApps = (dashboardJson.applications || [])
            .filter((app: any) => app.event_id === ev.id)
            .map((app: any) => ({
              volunteer_id: app.volunteer_id,
              volunteer_name: app.volunteer_name,
              volunteer_photo: app.volunteer_photo,
              skills: app.skills || [],
              status: app.status || "PENDING",
              applied_at: app.applied_at
            }));
          
          return {
            ...ev,
            applications: eventApps
          };
        });
        
        setEvents(eventsWithApps);
      }
    } catch (error) {
      console.error("Failed to fetch organizer events:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

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
        setEvents(prev => prev.map(ev => {
          if (ev.id !== eventId) return ev;
          return {
            ...ev,
            applications: ev.applications.filter(app => app.volunteer_id !== volunteerId),
            volunteersFilled: status === "ACCEPTED" ? ev.volunteersFilled + 1 : ev.volunteersFilled
          };
        }));
        toast(`Application ${status.toLowerCase()}`, "success");
      }
    } catch (error) {
      console.error(`Failed to ${status} application:`, error);
      toast("Failed to update application", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this event? This will also remove all applications.")) return;
    
    setDeletingEvent(eventId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(prev => prev.filter(ev => ev.id !== eventId));
        toast("Event deleted successfully", "success");
      } else {
        toast("Failed to delete event", "error");
      }
    } catch (error) {
      toast("Network error while deleting", "error");
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    if (!user) return;
    if (!confirm("Mark this event as completed? This will award impact hours to accepted volunteers.")) return;
    
    setCompletingEvent(eventId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(prev => prev.map(ev => 
          ev.id === eventId ? { ...ev, status: "COMPLETED" } : ev
        ));
        toast("Event marked as completed!", "success");
      } else {
        toast("Failed to mark completed", "error");
      }
    } catch (error) {
      toast("Network error", "error");
    } finally {
      setCompletingEvent(null);
    }
  };

  // Filter events based on active tab
  const filteredEvents = events.filter(ev => {
    if (activeTab === "active") return ev.status !== "COMPLETED";
    if (activeTab === "completed") return ev.status === "COMPLETED";
    return true;
  });

  const activeCount = events.filter(ev => ev.status !== "COMPLETED").length;
  const completedCount = events.filter(ev => ev.status === "COMPLETED").length;
  const totalPendingApps = events.reduce((sum, ev) => sum + ev.applications.length, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-black tracking-tight">
            Manage Events
          </h1>
          <p className="text-[#86868B] mt-2 text-lg font-medium">
            Review applications and manage your events in one place.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-white hover:bg-zinc-800 transition-all shadow-md font-medium"
        >
          <Plus className="h-4 w-4" />
          Create New Event
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04]">
          <p className="text-sm text-[#86868B] font-medium">Total Events</p>
          <p className="text-3xl font-bold text-black mt-1">{events.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04]">
          <p className="text-sm text-[#86868B] font-medium">Active</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04]">
          <p className="text-sm text-[#86868B] font-medium">Completed</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{completedCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04]">
          <p className="text-sm text-[#86868B] font-medium">Pending Applications</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{totalPendingApps}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.06] gap-1">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-5 py-3 text-sm font-semibold transition-all relative ${
            activeTab === "all" 
              ? "text-black" 
              : "text-[#86868B] hover:text-black"
          }`}
        >
          All Events ({events.length})
          {activeTab === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab("active")}
          className={`px-5 py-3 text-sm font-semibold transition-all relative ${
            activeTab === "active" 
              ? "text-black" 
              : "text-[#86868B] hover:text-black"
          }`}
        >
          Active ({activeCount})
          {activeTab === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab("completed")}
          className={`px-5 py-3 text-sm font-semibold transition-all relative ${
            activeTab === "completed" 
              ? "text-black" 
              : "text-[#86868B] hover:text-black"
          }`}
        >
          Completed ({completedCount})
          {activeTab === "completed" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
        </button>
      </div>

      {/* Events List with Accordion */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-black/[0.08] rounded-3xl bg-white text-[#86868B]">
            <div className="mb-2 font-semibold text-xl text-black">
              {activeTab === "all" ? "No events created yet." : `No ${activeTab} events.`}
            </div>
            <div 
              className="text-base cursor-pointer hover:text-black transition-colors" 
              onClick={() => setIsModalOpen(true)}
            >
              Click here to create your first event.
            </div>
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <EventAccordion
              key={ev.id}
              event={ev}
              isExpanded={expandedEvents.has(ev.id)}
              onToggle={() => toggleEvent(ev.id)}
              onAccept={(volunteerId) => handleApplicationAction(ev.id, volunteerId, "ACCEPTED")}
              onReject={(volunteerId) => handleApplicationAction(ev.id, volunteerId, "REJECTED")}
              onDelete={() => handleDeleteEvent(ev.id)}
              onComplete={() => handleCompleteEvent(ev.id)}
              actionLoading={actionLoading}
              isDeleting={deletingEvent === ev.id}
              isCompleting={completingEvent === ev.id}
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

interface EventAccordionProps {
  event: EventWithApplications;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: (volunteerId: string) => void;
  onReject: (volunteerId: string) => void;
  onDelete: () => void;
  onComplete: () => void;
  actionLoading: string | null;
  isDeleting: boolean;
  isCompleting: boolean;
}

function EventAccordion({ 
  event, 
  isExpanded, 
  onToggle, 
  onAccept, 
  onReject, 
  onDelete,
  onComplete,
  actionLoading,
  isDeleting,
  isCompleting
}: EventAccordionProps) {
  const percentFilled = event.volunteersTotal 
    ? Math.round((event.volunteersFilled / event.volunteersTotal) * 100) 
    : 0;
  
  const pendingCount = event.applications.length;
  const isCompleted = event.status === "COMPLETED";
  const isFull = event.volunteersFilled >= event.volunteersTotal;

  return (
    <div className={`rounded-3xl border bg-white overflow-hidden transition-all duration-300 ${
      isExpanded ? "border-black/[0.08] shadow-lg" : "border-black/[0.04] hover:shadow-md"
    } ${isFull && !isCompleted ? "ring-2 ring-red-100" : ""}`}>
      {/* Event Header - Always Visible */}
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Event Info */}
          <div className="flex items-start gap-4 flex-1">
            <button className="mt-1 p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-zinc-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-600" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-black tracking-tight truncate">
                  {event.title}
                </h3>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase ${
                  isCompleted 
                    ? "bg-zinc-100 text-zinc-500 border border-zinc-200" 
                    : isFull
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                }`}>
                  {isCompleted ? "COMPLETED" : isFull ? "FULL" : event.status}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100/50 text-xs font-bold">
                    {pendingCount} pending
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[#86868B]">
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date || "No date set"}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className={`flex items-center gap-2 font-medium ${isFull && !isCompleted ? "text-red-600" : ""}`}>
                  <Users className={`h-4 w-4 ${isFull && !isCompleted ? "text-red-500" : ""}`} />
                  <span className={isFull && !isCompleted ? "font-bold" : ""}>
                    {event.volunteersFilled}/{event.volunteersTotal} volunteers
                    {isFull && !isCompleted && " (Full)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Progress & Actions */}
          <div className="flex items-center gap-4 pl-12 lg:pl-0" onClick={(e) => e.stopPropagation()}>
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <span className={`text-sm font-semibold ${isFull && !isCompleted ? "text-red-600" : "text-black"}`}>
                {percentFilled}% filled
              </span>
              <div className="w-32 bg-zinc-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCompleted 
                      ? "bg-zinc-400" 
                      : isFull 
                      ? "bg-red-500" 
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(percentFilled, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <button
                  onClick={onComplete}
                  disabled={isCompleting}
                  className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  title="Mark Complete"
                >
                  {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Delete Event"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - Applications */}
      {isExpanded && (
        <div className="border-t border-black/[0.04] bg-zinc-50/50">
          <div className="p-6">
            <h4 className="text-sm font-bold text-[#86868B] uppercase tracking-wider mb-4">
              Pending Applications ({pendingCount})
            </h4>
            
            {pendingCount === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-black/[0.06] bg-white">
                <Clock className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-[#86868B] font-medium">No pending applications for this event.</p>
                <p className="text-sm text-zinc-400 mt-1">Applications will appear here when volunteers apply.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {event.applications.map((app) => (
                  <ApplicationCard
                    key={app.volunteer_id}
                    application={app}
                    eventId={event.id}
                    onAccept={() => onAccept(app.volunteer_id)}
                    onReject={() => onReject(app.volunteer_id)}
                    isLoading={
                      actionLoading === `${event.id}-${app.volunteer_id}-ACCEPTED` ||
                      actionLoading === `${event.id}-${app.volunteer_id}-REJECTED`
                    }
                  />
                ))}
              </div>
            )}

            {/* Event Skills */}
            {event.skills && event.skills.length > 0 && (
              <div className="mt-6 pt-6 border-t border-black/[0.04]">
                <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-wider mb-3">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="text-xs font-medium bg-white border border-black/[0.06] px-3 py-1.5 rounded-lg text-[#1D1D1F]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
  eventId: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading: boolean;
}

function ApplicationCard({ application, onAccept, onReject, isLoading }: ApplicationCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-black/[0.04] gap-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-base font-bold text-zinc-600 overflow-hidden">
          {application.volunteer_photo ? (
            <img 
              src={application.volunteer_photo} 
              alt={application.volunteer_name}
              className="h-full w-full object-cover"
            />
          ) : (
            application.volunteer_name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <h4 className="font-semibold text-black text-lg">{application.volunteer_name}</h4>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {application.skills.slice(0, 4).map((skill) => (
              <span 
                key={skill} 
                className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded-md text-zinc-600 uppercase tracking-wider"
              >
                {skill}
              </span>
            ))}
            {application.skills.length > 4 && (
              <span className="text-[10px] font-bold text-zinc-400">
                +{application.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pl-16 sm:pl-0">
        <button 
          onClick={onAccept}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Accept
        </button>
        <button 
          onClick={onReject}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>
    </div>
  );
}
