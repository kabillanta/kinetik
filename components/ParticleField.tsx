"use client";

import { useEffect, useRef, useCallback } from "react";

// --- Configuration Types ---
interface ParticleConfig {
  // Particle appearance
  count?: number;
  minSize?: number;
  maxSize?: number;
  baseOpacity?: number;
  color?: string;

  // Interaction
  interactionRadius?: number;
  repulsionStrength?: number;
  returnSpeed?: number; // Spring-like return (0-1)

  // Effects on proximity
  proximityScale?: number; // Scale multiplier on hover
  proximityOpacity?: number; // Opacity on hover

  // Performance
  enableOnMobile?: boolean;
  fpsLimit?: number;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  vx: number;
  vy: number;
}

const DEFAULT_CONFIG: Required<ParticleConfig> = {
  count: 100,
  minSize: 2.5,
  maxSize: 4.5,
  baseOpacity: 0.4,
  color: "120, 130, 150", // RGB for brighter blue-gray
  interactionRadius: 150,
  repulsionStrength: 0.8,
  returnSpeed: 0.08,
  proximityScale: 1.8,
  proximityOpacity: 0.7,
  enableOnMobile: false,
  fpsLimit: 60,
};

export default function ParticleField(props: ParticleConfig) {
  const config = { ...DEFAULT_CONFIG, ...props };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  // Initialize particles
  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < config.count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size =
          config.minSize + Math.random() * (config.maxSize - config.minSize);
        const opacity =
          config.baseOpacity * (0.5 + Math.random() * 0.5);

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size,
          opacity,
          baseOpacity: opacity,
          vx: 0,
          vy: 0,
        });
      }
      particlesRef.current = particles;
    },
    [config.count, config.minSize, config.maxSize, config.baseOpacity]
  );

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // FPS limiting
      const frameInterval = 1000 / config.fpsLimit;
      const deltaTime = timestamp - lastFrameRef.current;
      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = timestamp - (deltaTime % frameInterval);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      for (const particle of particles) {
        // Calculate distance to cursor
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Interaction within radius
        if (distance < config.interactionRadius && distance > 0) {
          // Normalized distance (0 at cursor, 1 at edge of radius)
          const normalizedDist = distance / config.interactionRadius;
          const force = (1 - normalizedDist) * config.repulsionStrength;

          // Repulsion force (opposite direction from cursor)
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 2;
          particle.vy -= Math.sin(angle) * force * 2;

          // Scale and opacity based on proximity
          const proximityFactor = 1 - normalizedDist;
          particle.opacity =
            particle.baseOpacity +
            (config.proximityOpacity - particle.baseOpacity) * proximityFactor;
        } else {
          // Fade back to base opacity
          particle.opacity +=
            (particle.baseOpacity - particle.opacity) * config.returnSpeed;
        }

        // Spring-like return to base position
        const returnDx = particle.baseX - particle.x;
        const returnDy = particle.baseY - particle.y;
        particle.vx += returnDx * config.returnSpeed;
        particle.vy += returnDy * config.returnSpeed;

        // Apply velocity with damping
        particle.vx *= 0.92;
        particle.vy *= 0.92;
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Calculate current scale based on velocity (subtle effect)
        const velocity = Math.sqrt(
          particle.vx * particle.vx + particle.vy * particle.vy
        );
        const scale = 1 + Math.min(velocity * 0.1, config.proximityScale - 1);
        const currentSize = particle.size * scale;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${config.color}, ${particle.opacity})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [config]
  );

  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Touch support
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      mouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    initParticles(window.innerWidth, window.innerHeight);
  }, [initParticles]);

  useEffect(() => {
    // Check for mobile/low-power devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !config.enableOnMobile) {
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      return;
    }

    handleResize();

    // Event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    animate,
    handleMouseMove,
    handleMouseLeave,
    handleTouchMove,
    handleTouchEnd,
    handleResize,
    config.enableOnMobile,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        opacity: 1,
      }}
      aria-hidden="true"
    />
  );
}
