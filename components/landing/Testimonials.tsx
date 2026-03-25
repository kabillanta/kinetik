"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, Star, Palette, Code2, BarChart3 } from "lucide-react";

const TestimonialCard = ({ quote, name, role, avatar, delay }: { quote: string, name: string, role: string, avatar: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-500 flex flex-col h-full"
  >
    <div className="flex gap-1 mb-6">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      ))}
    </div>
    <p className="text-slate-700 text-lg font-medium leading-relaxed mb-8 flex-grow">
       "{quote}"
    </p>
    <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
       <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/10">
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
       </div>
       <div>
          <div className="font-bold text-slate-900">{name}</div>
          <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">{role}</div>
       </div>
    </div>
  </motion.div>
);

const Testimonials = () => {
  const testimonials = [
    {
      quote: "KinetiK changed how I view open-source. The precision of the matches is incredible. I found a project that fit my React skills perfectly in minutes.",
      name: "Sarah Chen",
      role: "UX Engineer",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      delay: 0.1
    },
    {
      quote: "As an event organizer, finding the right talent used to be a nightmare. Now, I have a pool of verified, enthusiastic developers ready to build.",
      name: "Marcus Johnson",
      role: "Hackathon Lead",
      avatar: "https://i.pravatar.cc/150?u=marcus",
      delay: 0.2
    },
    {
      quote: "The impact tracking feature is a game-changer. I have a live, verifiable portfolio of my contributions that helped me land my first tech job.",
      name: "Priya Patel",
      role: "Fullstack Developer",
      avatar: "https://i.pravatar.cc/150?u=priya",
      delay: 0.3
    }
  ];

  return (
    <section id="community-stories" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Quote className="w-4 h-4" />
                Community Stories
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Voice of Builders
             </h2>
             <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                Discover how KinetiK is helping developers find their purpose and organizers accelerate their impact.
             </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
