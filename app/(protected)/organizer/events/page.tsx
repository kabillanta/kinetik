"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Plus, MapPin, Users, Loader2 } from "lucide-react";
import CreateEventModal from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth-context";

export default function OrganizerEvents() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(
        `http://localhost:8000/api/organizers/${user.uid}/events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const json = await res.json();
        setEvents(json.events || []);
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-black tracking-tight">
            Manage Events
          </h1>
          <p className="text-[#86868B] mt-2 text-lg font-medium">
            Create, edit, and track your volunteer events.
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

      {/* Tabs */}
      <div className="flex border-b border-black/4 gap-8">
        <button className="border-b-2 border-black pb-4 text-sm font-semibold text-black">
          All Events ({events.length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
           <div className="flex justify-center p-12">
             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
           </div>
        ) : events.length === 0 ? (
           <div className="p-16 text-center border-2 border-dashed border-black/8 rounded-3xl bg-white text-[#86868B]">
              <div className="mb-2 font-semibold text-xl text-black">
                No events created yet.
              </div>
              <div className="text-base cursor-pointer hover:text-black transition-colors" onClick={() => setIsModalOpen(true)}>
                Click here to start making an impact.
              </div>
            </div>
        ) : (
          events.map((ev) => (
             <EventCard
                key={ev.id}
                title={ev.title}
                date={ev.date}
                location={ev.location}
                volunteersFilled={ev.volunteersFilled}
                volunteersTotal={ev.volunteersTotal}
                status={ev.status}
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

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  volunteersFilled: number;
  volunteersTotal: number;
  status: string;
}

function EventCard({
  title,
  date,
  location,
  volunteersFilled,
  volunteersTotal,
  status,
}: EventCardProps) {
  const percentFilled = volunteersTotal ? Math.round((volunteersFilled / volunteersTotal) * 100) : 0;

  return (
    <div className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-3xl border border-black/4 bg-white hover:shadow-lg transition-all gap-6 duration-300">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-black tracking-tight group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-xs font-bold tracking-widest uppercase">
            {status}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-[#86868B]">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-[#86868B]" />
          <span className="font-semibold text-black">{volunteersFilled}</span>
          <span className="text-[#86868B] font-medium">
            / {volunteersTotal} Volunteers
          </span>
        </div>
        <div className="w-full md:w-48 bg-zinc-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full"
            style={{ width: `${percentFilled}%` }}
          />
        </div>
        <div className="flex items-center gap-3 mt-3 w-full md:w-auto">
          <Link href="/organizer/dashboard" className="flex-1 md:flex-none px-5 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-black/8 hover:border-black/10 rounded-full text-sm font-semibold text-[#1D1D1F] text-center transition-all shadow-sm">
            Manage Applications
          </Link>
        </div>
      </div>
    </div>
  );
}
