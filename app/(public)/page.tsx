/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { Zap, Code2 } from "lucide-react";
import Link from "next/link";

// --- Components ---

const FloatingNavbar = () => {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* The Bubble */}
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-6xl px-3 py-2 bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 pl-3">
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
            <span className="font-bold text-white text-sm">K</span>
          </div>
          <span className="font-bold tracking-tight text-lg text-black">
            KinetiK
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
          <Link href="/signup" className="hover:text-black transition-colors">
            For Volunteers
          </Link>
          <Link href="/signup" className="hover:text-black transition-colors">
            For Organizers
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button className="text-sm font-bold text-black px-4 py-2 hover:bg-zinc-100 rounded-full transition-colors">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="text-sm font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] px-6 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(0,113,227,0.3)] transition-all active:scale-95">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#FAFAFA] overflow-hidden pt-32 pb-20">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="mx-auto w-full max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Typography & Input */}
        <div className="max-w-xl">
          <h1 className="text-[4rem] sm:text-[5.5rem] lg:text-[6.5rem] font-bold tracking-tighter leading-[0.95] text-black flex flex-col items-start">
            <span>Stop searching.</span>
            <span className="flex items-center gap-4 mt-2">
              Start
              <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-6 py-2 pb-3 rounded-full border border-blue-100/80 transform -rotate-2 shadow-sm text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-none">
                solving.
              </span>
            </span>
          </h1>

          <p className="mt-6 text-lg text-zinc-500 font-medium leading-relaxed max-w-md pr-8">
            The fragmented way of finding volunteer work is over. KinetiK uses
            AI to instantly match your tech stack with events that need exactly
            what you know.
          </p>

          <div className="mt-16 flex flex-col sm:flex-row items-start gap-8">
            <Link href="/signup">
              <button className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-12 py-6 rounded-full border border-blue-100/80 transform hover:-rotate-1 transition-all text-3xl font-bold active:scale-95 shadow-[0_20px_40px_rgba(59,130,246,0.1)]">
                Join KinetiK.
              </button>
            </Link>
          </div>
        </div>

        {/* Right Side: UI Match Engine Visualization */}
        <div className="relative hidden lg:flex flex-col items-center justify-center">
          {/* Volunteer Card */}
          <div className="w-[380px] bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 relative z-20 translate-x-16 -translate-y-4">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  JD
                </div>
                <div>
                  <div className="text-lg font-bold text-black leading-tight">
                    Jane Dev
                  </div>
                  <div className="text-sm text-zinc-500 font-medium">
                    Full Stack Engineer
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                Available
              </span>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                React
              </span>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                Next.js
              </span>
              <span className="px-4 py-1.5 bg-zinc-50 text-zinc-600 rounded-full text-xs font-bold border border-zinc-100">
                Mentorship
              </span>
            </div>
          </div>

          {/* Connecting Line & AI Badge */}
          <div className="h-20 w-full flex items-center justify-center relative translate-x-12">
            <div className="absolute h-full w-px bg-zinc-200"></div>
            <div className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 z-10 shadow-lg relative">
              <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              98% AI MATCH
            </div>
          </div>

          {/* Event Card */}
          <div className="w-[420px] bg-white rounded-[2rem] p-7 shadow-[0_30px_60px_rgb(0,0,0,0.08)] border border-zinc-100 relative z-10 -translate-x-8 translate-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold text-black leading-tight">
                  Global Hackathon '26
                </div>
                <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">
                  Needs: Workshop Lead
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-sm font-medium text-zinc-600">
                  Must know React & State Mgmt
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-sm font-medium text-zinc-600">
                  Experience speaking at events
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-zinc-400">
                Oct 12–14 • Remote
              </span>
              <Link href="/signup">
                <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-blue-200 antialiased font-sans">
      <FloatingNavbar />
      <Hero />
    </div>
  );
}
