"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Target, PartyPopper, Zap, GraduationCap, Users } from "lucide-react";

const StatItem = ({ label, value, icon: Icon, delay }: { label: string, value: string, icon: any, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center text-center p-6 border-r border-slate-100 last:border-0"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{value}</div>
    <div className="text-slate-500 font-bold uppercase text-[px] tracking-widest">{label}</div>
  </motion.div>
);

const Stats = () => {
  const stats = [
    { label: "Contribution Hours", value: "10,240+", icon: Clock, delay: 0.1 },
    { label: "Match Success Rate", value: "94%", icon: Target, delay: 0.2 },
    { label: "Active Events", value: "540+", icon: PartyPopper, delay: 0.3 },
    { label: "Total Contributors", value: "2,150", icon: Users, delay: 0.4 },
  ];

  return (
    <section id="community" className="py-20 px-6 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <StatItem key={i} {...stat} />
        ))}
      </div>
    </section>
  );
};

export default Stats;
