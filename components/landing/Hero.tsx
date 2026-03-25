"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Heart,
  Rocket,
  Globe,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid opacity-[0.4] pointer-events-none" />
      <div className="absolute top-0 -left-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-blob" />
      <div
        className="absolute bottom-0 -right-64 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-blob"
        style={{ animationDelay: "2s" }}
      />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 leading-[1.05] tracking-tight mb-8">
            Stop searching.
            <br />
            <span className="text-primary italic">Start solving.</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-lg mb-12 leading-relaxed">
            KinetiK matches{" "}
            <span className="text-slate-900 font-semibold underline decoration-primary/30 underline-offset-4">
              talented volunteers
            </span>{" "}
            with impactful open-source projects and hackathons using intelligent
            graph algorithms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <button className="btn-premium group bg-primary text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
                Join the Community
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-white text-slate-900 border border-slate-200 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-sm">
                Host an Event
              </button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden`}
                >
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-xs font-bold">
                +2k
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">
              Trusted by{" "}
              <span className="text-slate-900 font-bold">2,000+</span>{" "}
              developers world wide
            </div>
          </div>
        </motion.div>

        {/* Visuals */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          {/* Floating Cards Mockup */}
          <div className="relative z-20 glass rounded-[2.5rem] p-10 shadow-2xl shadow-primary/10 border border-white/40">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">
                    Perfect Match
                  </h3>
                  <p className="text-slate-500 font-medium">
                    Top 5% skill alignment
                  </p>
                </div>
              </div>
              <div className="px-5 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                98% Fit
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 relative group overflow-hidden">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
                    <Globe className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">
                      EcoTrack Open Source
                    </h4>
                    <p className="text-slate-500 text-sm mt-1">
                      Sustainability · Global Impact
                    </p>
                    <div className="flex gap-2 mt-4">
                      {["React", "Next.js", "Neo4j"].map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-primary text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow flex items-center justify-center gap-3">
                Confirm Application
                <Rocket className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-12 z-30 glass p-5 rounded-3xl shadow-xl border border-white/40 max-w-[180px]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-slate-900 text-sm">Success!</div>
            </div>
            <p className="text-slate-500 text-xs">
              You've been accepted to <b>KinetiK Core</b>
            </p>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-10 -left-12 z-30 glass p-6 rounded-3xl shadow-xl border border-white/40"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">420+</div>
                <div className="text-slate-500 text-xs font-bold uppercase">
                  Impact Hours
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
