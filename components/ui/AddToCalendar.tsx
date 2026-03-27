"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  downloadICS, 
  getGoogleCalendarUrl, 
  getOutlookCalendarUrl, 
  getYahooCalendarUrl 
} from "@/lib/calendar";

interface AddToCalendarProps {
  title: string;
  description?: string;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  url?: string;
  className?: string;
  variant?: "button" | "dropdown" | "icon";
}

export function AddToCalendar({
  title,
  description,
  location,
  startDate,
  endDate,
  url,
  className,
  variant = "dropdown",
}: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const event = {
    title,
    description,
    location,
    startDate: typeof startDate === "string" ? new Date(startDate) : startDate,
    endDate: endDate ? (typeof endDate === "string" ? new Date(endDate) : endDate) : undefined,
    url,
  };

  const handleGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    window.open(getOutlookCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleYahooCalendar = () => {
    window.open(getYahooCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleDownloadICS = () => {
    downloadICS(event);
    setIsOpen(false);
  };

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
            className
          )}
          aria-label="Add to calendar"
          title="Add to calendar"
        >
          <Calendar className="w-5 h-5" />
        </button>
        
        {isOpen && <CalendarDropdown onClose={() => setIsOpen(false)} handlers={{ handleGoogleCalendar, handleOutlookCalendar, handleYahooCalendar, handleDownloadICS }} />}
      </div>
    );
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleDownloadICS}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
          className
        )}
      >
        <Calendar className="w-4 h-4" />
        Add to Calendar
      </button>
    );
  }

  // Default: dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
          className
        )}
      >
        <Calendar className="w-4 h-4" />
        Add to Calendar
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && <CalendarDropdown onClose={() => setIsOpen(false)} handlers={{ handleGoogleCalendar, handleOutlookCalendar, handleYahooCalendar, handleDownloadICS }} />}
    </div>
  );
}

interface CalendarDropdownProps {
  onClose: () => void;
  handlers: {
    handleGoogleCalendar: () => void;
    handleOutlookCalendar: () => void;
    handleYahooCalendar: () => void;
    handleDownloadICS: () => void;
  };
}

function CalendarDropdown({ onClose, handlers }: CalendarDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
        <button
          onClick={handlers.handleGoogleCalendar}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <GoogleIcon />
          Google Calendar
          <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
        </button>
        <button
          onClick={handlers.handleOutlookCalendar}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <OutlookIcon />
          Outlook
          <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
        </button>
        <button
          onClick={handlers.handleYahooCalendar}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <YahooIcon />
          Yahoo Calendar
          <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={handlers.handleDownloadICS}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4 text-gray-400" />
          Download .ics file
        </button>
      </div>
    </>
  );
}

// Simple calendar service icons
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.353.228-.584.228h-8.178v-7.826l1.611 1.21.388.146h.146l.388-.146 1.611-1.21v-3.456h4.618c.23 0 .426.076.584.228.158.152.238.345.238.576v-.804zM15 12.22l-5.5-4.127V7.24L15 11.366l5.5-4.126v.853L15 12.22z" fill="#0072C6"/>
      <path d="M14 22H1c-.552 0-1-.448-1-1V3c0-.552.448-1 1-1h13c.552 0 1 .448 1 1v18c0 .552-.448 1-1 1z" fill="#0072C6"/>
      <path d="M7.5 18c-2.481 0-4.5-2.019-4.5-4.5S5.019 9 7.5 9 12 11.019 12 13.5 9.981 18 7.5 18zm0-7c-1.378 0-2.5 1.122-2.5 2.5S6.122 16 7.5 16 10 14.878 10 13.5 8.878 11 7.5 11z" fill="white"/>
    </svg>
  );
}

function YahooIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#6001D2">
      <path d="M12.541 14.263l4.497 9.737h-4.027l-2.556-5.897-2.593 5.897H3.809l4.534-9.737L4.167 6h4.072l2.277 5.29L12.793 6h4.027l-4.279 8.263z"/>
      <circle cx="18" cy="6" r="3"/>
    </svg>
  );
}

export default AddToCalendar;
