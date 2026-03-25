"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Rocket } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-grid opacity-[0.3] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center relative z-10 border border-white/50 shadow-2xl shadow-primary/5 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-10">
           <Rocket className="w-10 h-10 text-primary animate-bounce-subtle" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
           Ready to make <br />
           <span className="text-primary italic">real impact?</span>
        </h2>
        
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium">
           Join the community of builders, designers, and organizers who are shaping the future of technology together.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/signup">
            <button className="btn-premium flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/20">
              Get Started for Free
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-colors shadow-sm">
              Log In
            </button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
           <Sparkles className="w-4 h-4 text-primary" />
           No Credit Card Required
           <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCTA;
