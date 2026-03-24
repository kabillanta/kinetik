/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Calendar, MapPin, Building, ArrowLeft, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/components/Toast";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();

        const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in">
      <div className="mb-8">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-black transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-black tracking-tight">My Applications</h1>
        <p className="text-[#86868B] mt-2 font-medium">Track the events you've signed up for and their status.</p>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-black/[0.08] rounded-3xl bg-white">
          <div className="mb-2 font-semibold text-xl text-black">No applications found</div>
          <div className="text-[#86868B]">You haven't applied to any events yet. Head to the dashboard to find opportunities!</div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-zinc-800 transition-all shadow-md"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, idx) => (
            <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl border border-black/[0.04] bg-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center font-bold text-lg text-black shrink-0">
                  {app.title.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-black text-xl tracking-tight">{app.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-[#86868B] font-medium">
                      <Building className="h-4 w-4" /> {app.organizer}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#86868B] font-medium">
                      <Calendar className="h-4 w-4" /> {app.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#86868B] font-medium">
                      <MapPin className="h-4 w-4" /> {app.location}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 md:mt-0 flex gap-3">
                {app.status === "ACCEPTED" ? (
                   <div className="flex gap-2">
                     <span className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm border border-emerald-200 shadow-sm">
                       Accepted
                     </span>
                     <button
                       onClick={async () => {
                         if (!user) return;
                         if (!confirm("Are you sure you want to withdraw from an accepted event?")) return;
                         setWithdrawing(app.id);
                         try {
                           const token = await user.getIdToken();
                           const res = await fetch(`${API_BASE_URL}/api/events/${app.id}/apply`, {
                             method: "DELETE",
                             headers: { Authorization: `Bearer ${token}` },
                           });
                           if (res.ok) {
                             setApplications(prev => prev.filter(a => a.id !== app.id));
                             toast("Application withdrawn", "success");
                           } else {
                             toast("Failed to withdraw", "error");
                           }
                         } catch {
                           toast("Network error", "error");
                         } finally {
                           setWithdrawing(null);
                         }
                       }}
                       disabled={withdrawing === app.id}
                       className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 font-semibold text-sm transition-all disabled:opacity-50"
                     >
                       {withdrawing === app.id ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <><XIcon className="h-4 w-4 mr-1" /> Withdraw</>
                       )}
                     </button>
                   </div>
                ) : app.status === "REJECTED" ? (
                   <span className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-red-100 text-red-700 font-bold text-sm border border-red-200 shadow-sm">
                     Not Selected
                   </span>
                ) : (
                   <div className="flex gap-2">
                     <span className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-amber-100 text-amber-700 font-bold text-sm border border-amber-200 shadow-sm">
                       Pending Review
                     </span>
                     <button
                       onClick={async () => {
                         if (!user) return;
                         setWithdrawing(app.id);
                         try {
                           const token = await user.getIdToken();
                           const res = await fetch(`${API_BASE_URL}/api/events/${app.id}/apply`, {
                             method: "DELETE",
                             headers: { Authorization: `Bearer ${token}` },
                           });
                           if (res.ok) {
                             setApplications(prev => prev.filter(a => a.id !== app.id));
                             toast("Application withdrawn", "success");
                           } else {
                             toast("Failed to withdraw", "error");
                           }
                         } catch {
                           toast("Network error", "error");
                         } finally {
                           setWithdrawing(null);
                         }
                       }}
                       disabled={withdrawing === app.id}
                       className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 font-semibold text-sm transition-all disabled:opacity-50"
                     >
                       {withdrawing === app.id ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <><XIcon className="h-4 w-4 mr-1" /> Withdraw</>
                       )}
                     </button>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}