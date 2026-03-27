"use client";

import { useState } from "react";
import { Bell, User, Shield, Palette } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NotificationSettings } from "@/components/NotificationSettings";
import { cn } from "@/lib/utils";

type SettingsTab = "notifications" | "profile" | "privacy" | "appearance";

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    description: "Manage your notification preferences",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    description: "Update your profile information",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: <Shield className="w-5 h-5" />,
    description: "Control your privacy settings",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette className="w-5 h-5" />,
    description: "Customize how KinetiK looks",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in">
      <Breadcrumbs items={[{ label: "Settings" }]} className="mb-6" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  activeTab === tab.id ? "text-purple-600" : "text-gray-400"
                )}>
                  {tab.icon}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "notifications" && <NotificationSettings />}
          
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Profile Settings</h3>
              <p className="text-gray-500 mb-4">
                Edit your profile information from your profile page.
              </p>
              <a
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Profile
              </a>
            </div>
          )}
          
          {activeTab === "privacy" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Control who can see your profile</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>Everyone</option>
                    <option>Organizers Only</option>
                    <option>Private</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Show in Recommendations</p>
                    <p className="text-sm text-gray-500">Allow organizers to discover you</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-purple-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                    <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Data Download</p>
                    <p className="text-sm text-gray-500">Download all your data</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                    Request Download
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "appearance" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {["light", "dark", "system"].map((theme) => (
                      <button
                        key={theme}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-lg border-2 text-center capitalize transition-all",
                          theme === "light"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 text-center">
                    More appearance options coming soon!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
