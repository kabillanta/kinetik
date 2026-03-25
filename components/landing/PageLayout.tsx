"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const PageLayout = ({ title, subtitle, children }: PageLayoutProps) => {
  return (
    <main className="min-h-screen bg-white selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      <Navbar />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none pt-24" />
      <div className="absolute top-24 -left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute top-24 -right-64 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="pt-32 pb-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-strong:text-slate-900 prose-a:text-primary hover:prose-a:underline"
          >
            {children}
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default PageLayout;
