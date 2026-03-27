"use client";

import { ReactNode } from "react";
import { 
  Calendar, 
  FileSearch, 
  Bell, 
  Users, 
  Inbox, 
  Search,
  ClipboardList,
  Sparkles,
  LucideIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

type EmptyStateVariant = 
  | "events"
  | "applications" 
  | "notifications"
  | "volunteers"
  | "search"
  | "history"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  children?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}> = {
  events: {
    icon: Calendar,
    title: "No events yet",
    description: "Create your first event to start recruiting volunteers.",
    actionLabel: "Create Event",
    actionHref: "/organizer/events",
  },
  applications: {
    icon: ClipboardList,
    title: "No applications yet",
    description: "When you apply to volunteer opportunities, they'll appear here.",
    actionLabel: "Explore Events",
    actionHref: "/dashboard",
  },
  notifications: {
    icon: Bell,
    title: "All caught up!",
    description: "You have no new notifications. We'll let you know when something happens.",
  },
  volunteers: {
    icon: Users,
    title: "No volunteers yet",
    description: "Once volunteers apply to your events, they'll appear here.",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
  },
  history: {
    icon: FileSearch,
    title: "No activity yet",
    description: "Your volunteering history will appear here after you complete events.",
    actionLabel: "Find Events",
    actionHref: "/dashboard",
  },
  generic: {
    icon: Inbox,
    title: "Nothing here",
    description: "This section is empty.",
  },
};

export function EmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon: CustomIcon,
  children,
}: EmptyStateProps) {
  const router = useRouter();
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;
  
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;
  const displayActionHref = actionHref || config.actionHref;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (displayActionHref) {
      router.push(displayActionHref);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-xl opacity-60" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <Icon className="w-10 h-10 text-purple-500" strokeWidth={1.5} />
        </div>
      </div>

      {/* Decorative dots */}
      <div className="flex gap-1 mb-4">
        <Sparkles className="w-4 h-4 text-purple-300" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {displayTitle}
      </h3>
      <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
        {displayDescription}
      </p>

      {/* Action button */}
      {(displayActionLabel && (displayActionHref || onAction)) && (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
        >
          {displayActionLabel}
        </button>
      )}

      {/* Custom children */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
