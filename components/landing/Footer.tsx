"use client";

import React from "react";
import Link from "next/link";
import { Heart, Github, Twitter, Linkedin, Rocket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 px-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-2">
             <Link href="/" className="flex items-center gap-3 mb-8 group">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                   <span className="font-bold text-white text-xl">K</span>
                </div>
                <span className="font-bold text-3xl text-white tracking-tight">
                   KinetiK
                </span>
             </Link>
             <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-10 font-medium">
                The intelligent ecosystem connecting high-impact volunteers with the next generation of open-source and community-driven technology.
             </p>
             <div className="flex gap-6">
                <a href="#" className="p-3 rounded-full bg-white/5 hover:bg-primary transition-all duration-300">
                   <Github className="w-6 h-6" />
                </a>
                <a href="#" className="p-3 rounded-full bg-white/5 hover:bg-primary transition-all duration-300">
                   <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="p-3 rounded-full bg-white/5 hover:bg-primary transition-all duration-300">
                   <Linkedin className="w-6 h-6" />
                </a>
             </div>
          </div>

          <div>
             <h4 className="text-xl font-bold mb-8">Platform</h4>
             <ul className="space-y-4">
                {['Why KinetiK', 'How it Works', 'Explore Projects', 'Organize Events'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">{link}</a>
                  </li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="text-xl font-bold mb-8">Company</h4>
             <ul className="space-y-4">
                {[
                  { name: 'About Us', href: '/about' },
                  { name: 'Privacy Policy', href: '/privacy' },
                  { name: 'Terms of Service', href: '/terms' },
                  { name: 'Contact Support', href: '/support' }
                ].map(link => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-slate-400 hover:text-white transition-colors font-medium">
                      {link.name}
                    </Link>
                  </li>
                ))}
             </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-slate-500 font-bold text-sm tracking-widest uppercase">
              © {new Date().getFullYear()} KinetiK. ALL RIGHTS RESERVED.
           </div>
           <div className="flex items-center gap-2 text-slate-400 font-medium font-sans">
              Made with <Heart className="w-4 h-4 text-primary fill-primary flex-shrink-0" /> for the community.
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
