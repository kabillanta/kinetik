"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Mail, Calendar, Star, CheckCircle, Users } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export interface NotificationPreferences {
  // Email notifications
  emailEnabled: boolean;
  emailApplicationUpdates: boolean;
  emailEventReminders: boolean;
  emailNewOpportunities: boolean;
  emailReviewRequests: boolean;
  
  // In-app notifications
  inAppEnabled: boolean;
  inAppApplicationUpdates: boolean;
  inAppEventReminders: boolean;
  inAppNewMatches: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  emailApplicationUpdates: true,
  emailEventReminders: true,
  emailNewOpportunities: true,
  emailReviewRequests: true,
  inAppEnabled: true,
  inAppApplicationUpdates: true,
  inAppEventReminders: true,
  inAppNewMatches: true,
};

interface NotificationToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({
  icon,
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: NotificationToggleProps) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
      disabled ? "opacity-50" : "hover:bg-gray-50"
    }`}>
      <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          enabled ? "bg-purple-600" : "bg-gray-200"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.notificationPreferences) {
            setPreferences({
              ...defaultPreferences,
              ...data.notificationPreferences,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  const savePreferences = async (newPrefs: NotificationPreferences) => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: newPrefs,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Spinner size="sm" />}
            {saved && (
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Saved
              </span>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          <NotificationToggle
            icon={<Mail className="w-5 h-5" />}
            label="Enable Email Notifications"
            description="Master toggle for all email notifications"
            enabled={preferences.emailEnabled}
            onChange={(v) => updatePreference("emailEnabled", v)}
          />
          
          <NotificationToggle
            icon={<Bell className="w-5 h-5" />}
            label="Application Updates"
            description="When your application status changes"
            enabled={preferences.emailApplicationUpdates}
            onChange={(v) => updatePreference("emailApplicationUpdates", v)}
            disabled={!preferences.emailEnabled}
          />
          
          <NotificationToggle
            icon={<Calendar className="w-5 h-5" />}
            label="Event Reminders"
            description="Reminders before your upcoming events"
            enabled={preferences.emailEventReminders}
            onChange={(v) => updatePreference("emailEventReminders", v)}
            disabled={!preferences.emailEnabled}
          />
          
          <NotificationToggle
            icon={<Users className="w-5 h-5" />}
            label="New Opportunities"
            description="When new events match your skills"
            enabled={preferences.emailNewOpportunities}
            onChange={(v) => updatePreference("emailNewOpportunities", v)}
            disabled={!preferences.emailEnabled}
          />
          
          <NotificationToggle
            icon={<Star className="w-5 h-5" />}
            label="Review Requests"
            description="After completing an event"
            enabled={preferences.emailReviewRequests}
            onChange={(v) => updatePreference("emailReviewRequests", v)}
            disabled={!preferences.emailEnabled}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">In-App Notifications</h3>
              <p className="text-sm text-gray-500">Notifications within the app</p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          <NotificationToggle
            icon={<Bell className="w-5 h-5" />}
            label="Enable In-App Notifications"
            description="Master toggle for all in-app notifications"
            enabled={preferences.inAppEnabled}
            onChange={(v) => updatePreference("inAppEnabled", v)}
          />
          
          <NotificationToggle
            icon={<Bell className="w-5 h-5" />}
            label="Application Updates"
            description="Real-time status changes"
            enabled={preferences.inAppApplicationUpdates}
            onChange={(v) => updatePreference("inAppApplicationUpdates", v)}
            disabled={!preferences.inAppEnabled}
          />
          
          <NotificationToggle
            icon={<Calendar className="w-5 h-5" />}
            label="Event Reminders"
            description="Upcoming event alerts"
            enabled={preferences.inAppEventReminders}
            onChange={(v) => updatePreference("inAppEventReminders", v)}
            disabled={!preferences.inAppEnabled}
          />
          
          <NotificationToggle
            icon={<Users className="w-5 h-5" />}
            label="New Matches"
            description="When you match with new opportunities"
            enabled={preferences.inAppNewMatches}
            onChange={(v) => updatePreference("inAppNewMatches", v)}
            disabled={!preferences.inAppEnabled}
          />
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
