"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

export function Breadcrumbs({ 
  items, 
  className,
  showHome = true,
  separator,
}: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = showHome 
    ? [{ label: "Home", href: "/dashboard", icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <span className="mx-2 text-gray-300" aria-hidden="true">
                  {separator || <ChevronRight className="w-4 h-4" />}
                </span>
              )}

              {/* Breadcrumb item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                  )}
                >
                  {item.icon}
                  <span className={isFirst && item.icon ? "sr-only md:not-sr-only" : ""}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    isLast ? "text-gray-900 font-medium" : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Pre-built breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  applications: [
    { label: "Applications" }
  ],
  notifications: [
    { label: "Notifications" }
  ],
  profile: [
    { label: "Profile" }
  ],
  eventDetail: (eventTitle: string) => [
    { label: "Events", href: "/dashboard" },
    { label: eventTitle }
  ],
  organizerDashboard: [
    { label: "Organizer Dashboard" }
  ],
  organizerEvents: [
    { label: "Organizer", href: "/organizer/dashboard" },
    { label: "Events" }
  ],
  organizerAnalytics: [
    { label: "Organizer", href: "/organizer/dashboard" },
    { label: "Analytics" }
  ],
  onboarding: [
    { label: "Onboarding" }
  ],
};

export default Breadcrumbs;
