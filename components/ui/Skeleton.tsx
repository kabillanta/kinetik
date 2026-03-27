"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseClasses = "bg-gray-200";
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
    none: "",
  };

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width,
    height: height || (variant === "text" ? "1em" : undefined),
  };

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton layouts for common patterns
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={60} variant="rectangular" />
      <div className="flex gap-2">
        <Skeleton width={60} height={24} variant="rectangular" className="rounded-full" />
        <Skeleton width={80} height={24} variant="rectangular" className="rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton width="70%" height={20} />
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={60} height={24} variant="rectangular" className="rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton width={100} height={14} />
        <Skeleton width={80} height={14} />
      </div>
      <div className="flex gap-2">
        <Skeleton width={50} height={22} variant="rectangular" className="rounded-full" />
        <Skeleton width={70} height={22} variant="rectangular" className="rounded-full" />
        <Skeleton width={60} height={22} variant="rectangular" className="rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={100} height={14} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton width={60} height={32} className="mb-2" />
      <Skeleton width={80} height={12} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-100 bg-gray-50">
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
        <Skeleton width="20%" height={14} />
        <Skeleton width="15%" height={14} />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-50 last:border-0">
          <Skeleton width="30%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width={60} height={28} variant="rectangular" className="rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton width={150} height={24} />
          <Skeleton width={200} height={14} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonEventCard key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
