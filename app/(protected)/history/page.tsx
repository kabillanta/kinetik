"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  FileText,
  CheckCircle,
  XCircle,
  Clock3,
  Award,
  Star,
  FileDown
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ReviewModal } from "@/components/ui/ReviewModal";

interface HistoryEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: "COMPLETED" | "ACCEPTED" | "REJECTED" | "PENDING";
  event_status?: "COMPLETED" | "OPEN" | "CANCELLED";
  hours: number;
  skills: string[];
  organizer: string;
  organizer_id?: string;
  applied_at?: string;
  status_updated_at?: string;
}

interface HistoryStats {
  totalEvents: number;
  totalHours: number;
  completedEvents: number;
  topSkills: string[];
}

export default function HistoryPage() {
  const { user, userProfile } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
    organizerId: string;
    organizerName: string;
  } | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      
      // Use the new history endpoint
      const res = await fetch(`${API_BASE_URL}/api/volunteers/${user.uid}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const history = data.history || [];
        
        // Transform to history events
        const historyEvents: HistoryEvent[] = history.map((item: {
          id: string;
          title: string;
          date: string;
          location: string;
          status: string;
          event_status?: string;
          skills?: string[];
          organizer: string;
          organizer_id?: string;
          hours?: number;
          applied_at?: string;
          status_updated_at?: string;
        }) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          location: item.location,
          status: item.status as HistoryEvent["status"],
          event_status: item.event_status as HistoryEvent["event_status"],
          hours: item.hours || 4,
          skills: item.skills || [],
          organizer: item.organizer,
          organizer_id: item.organizer_id,
          applied_at: item.applied_at,
          status_updated_at: item.status_updated_at
        }));
        
        setEvents(historyEvents);
        
        // Use stats from API response
        const apiStats = data.stats;
        const allSkills = historyEvents.flatMap(e => e.skills);
        const skillCounts = allSkills.reduce((acc, skill) => {
          acc[skill] = (acc[skill] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topSkills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([skill]) => skill);
        
        setStats({
          totalEvents: apiStats?.total_applications || historyEvents.length,
          totalHours: apiStats?.total_hours || 0,
          completedEvents: apiStats?.completed || 0,
          topSkills
        });
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredEvents = events.filter(event => {
    if (filter === "completed") return event.status === "COMPLETED" || event.status === "ACCEPTED";
    if (filter === "pending") return event.status === "PENDING";
    return true;
  });

  const exportToCSV = () => {
    const headers = ["Event", "Date", "Location", "Status", "Hours", "Skills", "Organizer", "Applied At"];
    const rows = events.map(e => [
      e.title,
      e.date,
      e.location,
      e.status,
      e.hours.toString(),
      e.skills.join("; "),
      e.organizer,
      e.applied_at || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volunteer-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    // Dynamically import jsPDF to reduce bundle size
    const { default: jsPDF } = await import("jspdf");
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Volunteer History Certificate", pageWidth / 2, 30, { align: "center" });
    
    // Volunteer name
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Volunteer: ${userProfile?.displayName || user?.displayName || "Volunteer"}`, pageWidth / 2, 45, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 52, { align: "center" });
    
    // Stats summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Events: ${stats?.totalEvents || 0}`, 20, 80);
    doc.text(`Completed Events: ${stats?.completedEvents || 0}`, 20, 88);
    doc.text(`Total Hours: ${stats?.totalHours || 0}`, 20, 96);
    doc.text(`Top Skills: ${stats?.topSkills.slice(0, 3).join(", ") || "N/A"}`, 20, 104);
    
    // Events table header
    let yPos = 125;
    doc.setFont("helvetica", "bold");
    doc.text("Event History", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text("Event", 20, yPos);
    doc.text("Date", 100, yPos);
    doc.text("Status", 140, yPos);
    doc.text("Hours", 175, yPos);
    
    // Draw line
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 7;
    
    // Events
    doc.setFont("helvetica", "normal");
    const completedEvents = events.filter(e => e.status === "ACCEPTED" || e.status === "COMPLETED");
    
    for (const event of completedEvents.slice(0, 15)) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;
      }
      
      const title = event.title.length > 35 ? event.title.substring(0, 35) + "..." : event.title;
      doc.text(title, 20, yPos);
      doc.text(event.date || "TBD", 100, yPos);
      doc.text(event.status, 140, yPos);
      doc.text(event.hours.toString(), 175, yPos);
      yPos += 8;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Generated by KinetiK - Volunteer Management Platform", pageWidth / 2, 285, { align: "center" });
    
    // Save
    doc.save(`volunteer-certificate-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const canReviewEvent = (event: HistoryEvent) => {
    return event.status === "ACCEPTED" && event.event_status === "COMPLETED" && event.organizer_id;
  };

  const handleReviewClick = (event: HistoryEvent) => {
    if (!event.organizer_id) return;
    setReviewModal({
      isOpen: true,
      eventId: event.id,
      eventTitle: event.title,
      organizerId: event.organizer_id,
      organizerName: event.organizer
    });
  };

  const getStatusIcon = (status: HistoryEvent["status"]) => {
    switch (status) {
      case "COMPLETED":
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock3 className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: HistoryEvent["status"]) => {
    switch (status) {
      case "COMPLETED": return "Completed";
      case "ACCEPTED": return "Accepted";
      case "REJECTED": return "Not Selected";
      default: return "Pending";
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <Breadcrumbs items={[{ label: "Activity History" }]} className="mb-6" />
        <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Activity History</h1>
        <p className="text-gray-500 mb-8">Your volunteering journey and accomplishments.</p>
        <SkeletonList items={4} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 animate-in fade-in">
      <Breadcrumbs items={[{ label: "Activity History" }]} className="mb-6" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Activity History</h1>
          <p className="text-gray-500 mt-1">Your volunteering journey and accomplishments.</p>
        </div>
        {events.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF Certificate
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && stats.totalEvents > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Events</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedEvents}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Top Skills</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {stats.topSkills.slice(0, 2).join(", ") || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {events.length > 0 && (
        <div className="flex gap-2 mb-6">
          {(["all", "completed", "pending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "all" ? "All" : tab === "completed" ? "Completed" : "Pending"}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <EmptyState variant="history" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No events match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <div
              key={event.id}
              className="relative bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              {/* Timeline connector */}
              {index < filteredEvents.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-200 -mb-4" />
              )}
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{event.organizer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canReviewEvent(event) && (
                        <button
                          onClick={() => handleReviewClick(event)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )}
                      <span className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full ${
                        event.status === "COMPLETED" || event.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-700"
                          : event.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                    {(event.status === "COMPLETED" || event.status === "ACCEPTED") && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {event.hours} hours
                      </span>
                    )}
                  </div>
                  
                  {event.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {event.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {event.skills.length > 4 && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-400">
                          +{event.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Info */}
      {events.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Need this for your resume?</p>
              <p className="text-sm text-gray-500 mt-1">
                Export your volunteer history as a CSV file or download a PDF certificate to share with potential employers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal(null)}
          onSuccess={fetchHistory}
          eventId={reviewModal.eventId}
          eventTitle={reviewModal.eventTitle}
          revieweeId={reviewModal.organizerId}
          revieweeName={reviewModal.organizerName}
          type="organizer"
        />
      )}
    </div>
  );
}
