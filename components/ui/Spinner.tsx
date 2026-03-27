"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6", 
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="status">
      <Loader2 
        className={cn(
          "animate-spin text-purple-600",
          sizeClasses[size],
          className
        )} 
      />
      {label && (
        <span className="text-sm text-gray-500">{label}</span>
      )}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  label?: string;
  blur?: boolean;
}

export function LoadingOverlay({ 
  loading, 
  children, 
  label = "Loading...",
  blur = true 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-white/80 z-10",
            blur && "backdrop-blur-sm"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingPageProps {
  label?: string;
}

export function LoadingPage({ label = "Loading..." }: LoadingPageProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-2xl opacity-40 scale-150" />
        <div className="relative flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-gray-600 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  loadingText?: string;
}

export function LoadingButton({
  loading,
  children,
  className,
  disabled,
  onClick,
  type = "button",
  loadingText,
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

export default Spinner;
