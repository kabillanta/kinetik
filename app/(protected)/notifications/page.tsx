"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";
import { Bell, CheckCircle2, Loader2, Info } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    setMarkingId(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        toast("Marked as read", "success");
      }
    } catch (err) {
      toast("Failed to mark as read", "error");
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-black/[0.04] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Bell className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-black tracking-tight">Your Alerts</h1>
            <p className="text-[#86868B] font-medium">
              You have {unreadCount} unread message{unreadCount !== 1 && 's'}.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-black/[0.04] text-center shadow-sm">
            <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-zinc-300" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">You're all caught up!</h3>
            <p className="text-[#86868B]">When organizers respond to your applications, they will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm hover:shadow-md ${
                n.read ? 'bg-zinc-50 border-black/[0.04]' : 'bg-white border-blue-100 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  n.type.includes('ACCEPTED') ? 'bg-emerald-100 text-emerald-600' : 
                  n.type.includes('REJECTED') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {n.type.includes('ACCEPTED') ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${n.read ? 'text-zinc-600' : 'text-black'}`}>
                      {n.type.includes('ACCEPTED') ? 'Application Accepted!' : 'Application Update'}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[15px] font-medium text-zinc-600 leading-relaxed max-w-xl">
                    {n.message}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium mt-3">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  disabled={markingId === n.id}
                  className="shrink-0 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-black/10 text-black hover:bg-zinc-50 transition-all shadow-sm"
                >
                  {markingId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as read"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
