"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Why KinetiK", href: "#why-kinetik" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Community", href: "#community" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
          scrolled ? "bg-white/70 backdrop-blur-xl border-b border-slate-200/50" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <span className="font-bold text-white text-lg">K</span>
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">
              KinetiK
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <button className="text-sm font-semibold text-slate-700 hover:text-primary px-4 py-2 transition-colors">
                Log In
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-premium flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30">
                Get Started
                <Rocket className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white md:hidden pt-24 px-6 flex flex-col gap-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-slate-900"
              >
                {link.name}
              </a>
            ))}
            <div className="h-px bg-slate-100 w-full my-4" />
            <Link href="/login" className="w-full">
              <button className="w-full text-xl font-semibold text-slate-700 py-4">
                Log In
              </button>
            </Link>
            <Link href="/signup" className="w-full">
              <button className="w-full bg-primary text-white text-xl font-bold py-4 rounded-2xl shadow-xl shadow-primary/20">
                Get Started Free
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
