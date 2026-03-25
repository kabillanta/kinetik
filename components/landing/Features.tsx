"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  Cpu, 
  Fingerprint, 
  ShieldCheck, 
  Layers 
} from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-1"
  >
    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
      <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Precision Matching",
      description: "Our Neo4j-powered engine analyzes your stack and matches you with projects that actually need your specific skills.",
      delay: 0.1
    },
    {
      icon: Zap,
      title: "Instant Onboarding",
      description: "Join teams in seconds. Your verified KinetiK profile acts as your portfolio, no repetitive forms required.",
      delay: 0.2
    },
    {
      icon: MessageSquare,
      title: "Direct Connection",
      description: "Communicate directly with project maintainers and event organizers within the platform. No more ghosting.",
      delay: 0.3
    },
    {
      icon: BarChart3,
      title: "Live Impact Tracking",
      description: "Visualize your contributions and track your building hours. Export your impact report for resumes or social proof.",
      delay: 0.4
    },
    {
      icon: Fingerprint,
      title: "Verified Profiles",
      description: "Every contribution is verified. Build a trust-based reputation in the open-source community.",
      delay: 0.5
    },
    {
      icon: ShieldCheck,
      title: "Safe Environment",
      description: "Moderated events and projects ensure a professional, inclusive, and rewarding experience for everyone.",
      delay: 0.6
    }
  ];

  return (
    <section id="why-kinetik" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-grid opacity-[0.2] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 text-center mb-20">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-6">
            <Cpu className="w-4 h-4" />
            Core Technology
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
             Why KinetiK?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
             Connecting developers and organizers through intelligent graph-based matchmaking and seamless application tracking.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <FeatureCard key={i} {...f} />
        ))}
      </div>
    </section>
  );
};

export default Features;
