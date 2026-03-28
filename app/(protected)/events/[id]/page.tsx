"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Users, Briefcase, Loader2, Zap } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

interface EventDetail {
  id: string;
  title: string;
  description: string;
  role: string;
  location: string;
  date: string;
  organizer_name: string;
  organizer_id: string;
  skills: string[];
  applicant_count: number;
  user_has_applied?: boolean;
}

export default function EventDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!user || !eventId) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEvent(data.event);
          if (data.event.user_has_applied) {
            setApplied(true);
          }
        } else {
          toast("Event not found", "error");
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [user, eventId]);

  const handleApply = async () => {
    if (!user || !event) return;
    setApplying(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: user.displayName || "Volunteer" }),
      });
      if (res.ok) {
        setApplied(true);
        setEvent(prev => prev ? { ...prev, applicant_count: prev.applicant_count + 1 } : prev);
        toast("Application submitted!", "success");
      } else {
        const err = await res.json().catch(() => ({ detail: "Failed to apply" }));
        toast(err.detail || "Failed to apply", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!event) return null;

  const isOrganizer = user?.uid === event.organizer_id;

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-in fade-in">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-black transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Event Card */}
      <div className="rounded-3xl border border-black/[0.04] bg-white shadow-sm overflow-hidden">
        {/* Header gradient */}
        <div className="h-24 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-black" />

        <div className="p-8 md:p-10 -mt-8">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-2">
            {event.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-[#86868B] font-medium">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {event.role || "Volunteer"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {event.applicant_count} applicant{event.applicant_count !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Organizer */}
          <div className="mt-6 text-sm text-[#86868B]">
            Organized by <span className="text-black font-semibold">{event.organizer_name}</span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-black mb-3">About this Event</h2>
              <p className="text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Skills */}
          {event.skills.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-black mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {event.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-10 pt-6 border-t border-black/[0.04]">
            {isOrganizer ? (
              <p className="text-sm text-[#86868B] font-medium">
                You are the organizer of this event.
              </p>
            ) : applied ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                  <Zap className="h-4 w-4" /> Application Submitted
                </span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-black text-white font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {applying ? "Applying..." : "Apply Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
