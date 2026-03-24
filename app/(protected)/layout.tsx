/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  LogOut,
  Settings,
  Calendar,
  ClipboardList,
  BarChart3,
  ArrowRightLeft,
  Menu,
  X,
  Bell,
} from "lucide-react";
import React from "react";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isOrganizerMode = pathname?.startsWith("/organizer") || false;

  // Backup Client Check (in case Middleware misses something)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-4 rounded-2xl border-2 border-black/[0.04] animate-[spin_3s_linear_infinite]"></div>
            <div
              className="absolute -inset-4 rounded-2xl border-2 border-transparent border-t-blue-500 animate-spin"
              style={{ animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-xs font-bold tracking-widest text-[#86868B] uppercase animate-pulse">
            Verifying Credentials
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (pathname?.includes("/onboarding")) {
    return (
      <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-blue-200">
        <main className="flex-1 overflow-y-auto relative w-full">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          <div className="relative z-10 w-full min-h-screen">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-blue-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-black/[0.06] bg-white/80 backdrop-blur-3xl md:flex flex-col z-50 relative">
        <div className="flex h-20 items-center px-6 border-b border-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-zinc-800 to-black flex items-center justify-center shadow-md">
              <span className="font-semibold text-white text-lg leading-none">
                K
              </span>
            </div>
            <span className="font-semibold tracking-tight text-xl text-black">
              KinetiK
            </span>
          </div>
        </div>

        <div className="p-4 px-5">
          <div className="relative flex w-full rounded-2xl bg-zinc-100/80 p-1 border border-black/5 shadow-inner backdrop-blur-xl">
            {/* Sliding Pill */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.04)] border border-black/[0.03]"
              style={{
                left: isOrganizerMode ? 'calc(50% + 2px)' : '4px',
                transition: 'left 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            />
            
            {/* Volunteer Button */}
            <button
              onClick={() => { if (isOrganizerMode) router.push("/dashboard"); }}
              className={`relative z-10 flex-1 py-2.5 text-[13px] font-semibold tracking-wide rounded-xl cursor-default transition-all duration-500 ease-out group ${
                !isOrganizerMode 
                  ? 'text-zinc-900 cursor-default' 
                  : 'text-zinc-500 hover:text-zinc-700 cursor-pointer hover:bg-black/[0.02]'
              }`}
            >
              <span className={`transition-transform duration-500 inline-block ${!isOrganizerMode ? 'scale-105' : 'scale-100 group-hover:scale-[1.02]'}`}>
                Volunteer
              </span>
            </button>
            
            {/* Organizer Button */}
            <button
              onClick={() => { if (!isOrganizerMode) router.push("/organizer/dashboard"); }}
              className={`relative z-10 flex-1 py-2.5 text-[13px] font-semibold tracking-wide rounded-xl cursor-default transition-all duration-500 ease-out group ${
                isOrganizerMode 
                  ? 'text-zinc-900 cursor-default' 
                  : 'text-zinc-500 hover:text-zinc-700 cursor-pointer hover:bg-black/[0.02]'
              }`}
            >
              <span className={`transition-transform duration-500 inline-block ${isOrganizerMode ? 'scale-105' : 'scale-100 group-hover:scale-[1.02]'}`}>
                Organizer
              </span>
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {isOrganizerMode ? (
            <>
              <NavItem
                href="/organizer/dashboard"
                icon={<LayoutDashboard />}
                label="Dashboard"
                active={pathname === "/organizer/dashboard"}
              />
              <NavItem
                href="/organizer/events"
                icon={<Calendar />}
                label="My Events"
                active={pathname === "/organizer/events"}
              />
              <NavItem
                href="/organizer/analytics"
                icon={<BarChart3 />}
                label="Analytics"
                active={pathname === "/organizer/analytics"}
              />
              <NavItem
                href="/notifications"
                icon={<Bell />}
                label="Alerts"
                active={pathname === "/notifications"}
              />
              <NavItem
                href="/profile"
                icon={<User />}
                label="Profile"
                active={pathname === "/profile"}
              />
            </>
          ) : (
            <>
              <NavItem
                href="/dashboard"
                icon={<LayoutDashboard />}
                label="Feed"
                active={pathname === "/dashboard"}
              />
              <NavItem
                href="/applications"
                icon={<ClipboardList />}
                label="Applications"
                active={pathname === "/applications"}
              />
              <NavItem
                href="/notifications"
                icon={<Bell />}
                label="Alerts"
                active={pathname === "/notifications"}
              />
              <NavItem
                href="/profile"
                icon={<User />}
                label="Profile"
                active={pathname === "/profile"}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-black/[0.04]">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-black/[0.04] shadow-sm">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {userProfile?.imageUrl || user?.photoURL ? (
                <img
                  src={userProfile?.imageUrl || user?.photoURL || ""}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-semibold text-zinc-600">
                  {user.displayName?.charAt(0) || "V"}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-black">
                {userProfile?.displayName || user.displayName || "Volunteer"}
              </p>
              <p className="truncate text-xs text-[#86868B]">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-[#86868B] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F5F5F7] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="relative z-10 w-full min-h-screen pb-24 md:pb-16">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around bg-white/90 backdrop-blur-xl border-t border-black/[0.06] px-2 py-2 safe-area-pb">
        {isOrganizerMode ? (
          <>
            <MobileNavItem
              href="/organizer/dashboard"
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={pathname === "/organizer/dashboard"}
            />
            <MobileNavItem
              href="/organizer/events"
              icon={<Calendar />}
              label="Events"
              active={pathname === "/organizer/events"}
            />
            <MobileNavItem
              href="/organizer/analytics"
              icon={<BarChart3 />}
              label="Analytics"
              active={pathname === "/organizer/analytics"}
            />
            <MobileNavItem
              href="/notifications"
              icon={<Bell />}
              label="Alerts"
              active={pathname === "/notifications"}
            />
            <MobileNavItem
              href="/profile"
              icon={<User />}
              label="Profile"
              active={pathname === "/profile"}
            />
          </>
        ) : (
          <>
            <MobileNavItem
              href="/dashboard"
              icon={<LayoutDashboard />}
              label="Feed"
              active={pathname === "/dashboard"}
            />
            <MobileNavItem
              href="/applications"
              icon={<ClipboardList />}
              label="Apps"
              active={pathname === "/applications"}
            />
            <MobileNavItem
              href="/notifications"
              icon={<Bell />}
              label="Alerts"
              active={pathname === "/notifications"}
            />
            <MobileNavItem
              href="/profile"
              icon={<User />}
              label="Profile"
              active={pathname === "/profile"}
            />
            <button
              onClick={logout}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[#86868B] hover:text-red-500 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Logout</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

// Simple Nav Item Component
function NavItem({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-black text-white shadow-md"
          : "text-[#86868B] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
      }`}
    >
      {React.cloneElement(icon, { className: "h-4 w-4" })}
      {label}
    </Link>
  );
}

// Mobile Bottom Nav Item
function MobileNavItem({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
        active
          ? "text-black"
          : "text-[#86868B]"
      }`}
    >
      {React.cloneElement(icon, { className: "h-5 w-5" })}
      <span className={`text-[10px] font-semibold ${active ? "text-black" : ""}`}>{label}</span>
    </Link>
  );
}
