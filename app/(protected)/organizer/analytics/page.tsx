"use client";

import { useState, useEffect } from "react";
import { Users, Star, Clock, Loader2, CalendarCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OrganizerAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_volunteers: 0, volunteer_hours: 0, completed_events: 0, satisfaction: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:8000/api/organizers/${user.uid}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.stats) setStats(json.stats);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-4xl font-semibold text-black tracking-tight">
          Analytics & Impact
        </h1>
        <p className="text-[#86868B] mt-2 text-lg font-medium">
          Measure the impact your organization is making.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-black/4 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-wide text-sm">
              Total Volunteers
            </h3>
          </div>
          <div>
            <p className="text-4xl font-semibold text-black tracking-tight">
              {stats.total_volunteers}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-black/4 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-wide text-sm">
              Hours Logged
            </h3>
          </div>
          <div>
            <p className="text-4xl font-semibold text-black tracking-tight">
              {stats.volunteer_hours}
              <span className="text-xl text-[#86868B] font-medium ml-1">hrs</span>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-black/4 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-purple-600 mb-4">
            <div className="p-2 bg-purple-50 rounded-xl">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-wide text-sm">
              Events Created
            </h3>
          </div>
          <div>
            <p className="text-4xl font-semibold text-black tracking-tight">
              {stats.completed_events}
            </p>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl border border-black/4 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-wide text-sm">
              Satisfaction
            </h3>
          </div>
          <div>
            <p className="text-4xl font-semibold text-black tracking-tight">
              {stats.satisfaction}
              <span className="text-xl text-[#86868B] font-medium ml-1">%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}