"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Target, Rocket, MousePointer2 } from "lucide-react";

const Step = ({ number, icon: Icon, title, description, delay, isLast }: { number: string, icon: any, title: string, description: string, delay: number, isLast?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-500 group"
  >
    
    <div className="w-20 h-20 rounded-2xl bg-white shadow-xl shadow-slate-200 border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
       <Icon className="w-10 h-10 text-primary" />
    </div>

    <div className="text-primary font-black text-sm uppercase tracking-widest mb-4">Step {number}</div>
    <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-600 leading-relaxed font-medium">
       {description}
    </p>
  </motion.div>
);

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Define Your Stack",
      description: "Select your languages, frameworks, and areas of interest. Our graph database maps your unique technical DNA.",
      delay: 0.1
    },
    {
      number: "02",
      icon: Target,
      title: "Get Matches",
      description: "Receive personalized recommendations for open-source projects and hackathons that need your exact expertise.",
      delay: 0.2
    },
    {
      number: "03",
      icon: Rocket,
      title: "Start Building",
      description: "Apply with a single click and join a dedicated team of builders. Start making a real-world impact immediately.",
      delay: 0.3
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
      <div className="absolute -top-32 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-32 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-6">
              <MousePointer2 className="w-4 h-4" />
              Developer First Experience
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
               How it Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
               We've removed the friction from volunteering. No more searching, just building.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <Step key={i} {...step} isLast={i === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
