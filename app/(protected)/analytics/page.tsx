"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";
import {
  Calendar,
  Clock,
  Award,
  BarChart3,
  Target,
  Users,
  Star,
  RefreshCw,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SkeletonStatCard } from "@/components/ui/Skeleton";

interface AnalyticsData {
  totalEvents: number;
  acceptedEvents: number;
  completedEvents: number;
  totalHours: number;
  reputation: number;
  averageRating: number;
  reviewCount: number;
  topSkills: { skill: string; count: number; percentage: number }[];
  skillGrowth: number;
  monthlyActivity: { month: string; events: number; hours: number }[];
  communityAverage: {
    events: number;
    hours: number;
    rating: number;
  };
}

export default function VolunteerAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setError(null);
    try {
      const token = await user.getIdToken();

      // Fetch from dedicated analytics endpoint
      const res = await fetch(
        `${API_BASE_URL}/api/volunteers/${user.uid}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        throw new Error("Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <Breadcrumbs items={[{ label: "Analytics" }]} className="mb-6" />
        <h1 className="text-3xl font-bold text-black tracking-tight mb-8">Your Impact</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <Breadcrumbs items={[{ label: "Analytics" }]} className="mb-6" />
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || "Failed to load analytics data."}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchAnalytics();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in fade-in">
      <Breadcrumbs items={[{ label: "Analytics" }]} className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black tracking-tight">Your Impact</h1>
        <p className="text-gray-500 mt-1">
          Track your volunteering journey and see how you&apos;re making a difference.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          label="Total Events"
          value={analytics.totalEvents}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          label="Hours Volunteered"
          value={analytics.totalHours}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-amber-600" />}
          label="Reputation"
          value={analytics.reputation}
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-emerald-600" />}
          label="Average Rating"
          value={analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : "—"}
          subtitle={analytics.reviewCount > 0 ? `${analytics.reviewCount} reviews` : "No reviews yet"}
          bgColor="bg-emerald-50"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Skill Utilization */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Skill Utilization</h2>
              <p className="text-sm text-gray-500">Your most used skills</p>
            </div>
          </div>

          {analytics.topSkills.length > 0 ? (
            <div className="space-y-4">
              {analytics.topSkills.map((skill) => (
                <div key={skill.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{skill.skill}</span>
                    <span className="text-gray-500">{skill.count} events</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No skill data yet. Apply to events to build your profile!
            </p>
          )}
        </div>

        {/* Activity Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Activity Over Time</h2>
              <p className="text-sm text-gray-500">Events per month</p>
            </div>
          </div>

          {analytics.monthlyActivity.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-40">
              {analytics.monthlyActivity.map((month) => {
                const maxEvents = Math.max(...analytics.monthlyActivity.map((m) => m.events), 1);
                const height = (month.events / maxEvents) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">{month.events}</span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500 text-sm">No activity data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Community Comparison */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Community Comparison</h2>
            <p className="text-sm text-gray-400">How you compare to other volunteers</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <ComparisonMetric
            label="Completed"
            yourValue={analytics.completedEvents}
            avgValue={analytics.communityAverage.events}
          />
          <ComparisonMetric
            label="Hours"
            yourValue={analytics.totalHours}
            avgValue={analytics.communityAverage.hours}
          />
          <ComparisonMetric
            label="Rating"
            yourValue={analytics.averageRating || 0}
            avgValue={analytics.communityAverage.rating}
            format={(v) => (v > 0 ? v.toFixed(1) : "—")}
          />
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Achievements</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {analytics.completedEvents >= 1 && (
            <AchievementBadge title="First Event" icon="🎉" unlocked />
          )}
          {analytics.totalHours >= 10 && (
            <AchievementBadge title="10 Hours" icon="⏰" unlocked />
          )}
          {analytics.reputation >= 100 && (
            <AchievementBadge title="Rising Star" icon="⭐" unlocked />
          )}
          {analytics.topSkills.length >= 3 && (
            <AchievementBadge title="Multi-skilled" icon="🎯" unlocked />
          )}
          <AchievementBadge title="50 Hours" icon="🏆" unlocked={analytics.totalHours >= 50} />
          <AchievementBadge title="Top Rated" icon="💎" unlocked={analytics.averageRating >= 4.8} />
          <AchievementBadge title="100 Hours" icon="🌟" unlocked={analytics.totalHours >= 100} />
          <AchievementBadge title="Expert" icon="🔥" unlocked={analytics.completedEvents >= 20} />
        </div>
      </div>
    </div>
  );
}

// Helper components
function StatCard({
  icon,
  label,
  value,
  subtitle,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function ComparisonMetric({
  label,
  yourValue,
  avgValue,
  format = (v: number) => v.toString(),
}: {
  label: string;
  yourValue: number;
  avgValue: number;
  format?: (v: number) => string;
}) {
  const percentDiff = avgValue > 0 ? ((yourValue - avgValue) / avgValue) * 100 : 0;
  const isAbove = percentDiff > 0;

  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{format(yourValue)}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {avgValue > 0 && (
        <p className={`text-xs mt-1 ${isAbove ? "text-emerald-400" : percentDiff < 0 ? "text-red-400" : "text-gray-500"}`}>
          {isAbove ? "+" : ""}
          {percentDiff.toFixed(0)}% vs avg
        </p>
      )}
    </div>
  );
}

function AchievementBadge({
  title,
  icon,
  unlocked,
}: {
  title: string;
  icon: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
        unlocked
          ? "bg-amber-100 text-amber-800"
          : "bg-gray-100 text-gray-400 opacity-50"
      }`}
    >
      <span>{icon}</span>
      {title}
    </div>
  );
}
