/**
 * Calendar integration utilities for generating ICS files and calendar links.
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  url?: string;
}

/**
 * Generate an ICS (iCalendar) file content for an event.
 */
export function generateICS(event: CalendarEvent): string {
  const { title, description, location, startDate, endDate, url } = event;
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@kinetik.app`;
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(startDate.getTime() + 2 * 60 * 60 * 1000)); // Default 2 hours

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KinetiK//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(title)}`,
  ];

  if (description) {
    ics.push(`DESCRIPTION:${escapeText(description)}`);
  }

  if (location) {
    ics.push(`LOCATION:${escapeText(location)}`);
  }

  if (url) {
    ics.push(`URL:${url}`);
  }

  ics.push("END:VEVENT", "END:VCALENDAR");

  return ics.join("\r\n");
}

/**
 * Download an ICS file for an event.
 */
export function downloadICS(event: CalendarEvent): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate a Google Calendar URL for an event.
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const { title, description, location, startDate, endDate } = event;
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatDate(startDate);
  const end = endDate 
    ? formatDate(endDate) 
    : formatDate(new Date(startDate.getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
  });

  if (description) params.set("details", description);
  if (location) params.set("location", location);

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook.com calendar URL for an event.
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const { title, description, location, startDate, endDate } = event;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: startDate.toISOString(),
    enddt: (endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000)).toISOString(),
  });

  if (description) params.set("body", description);
  if (location) params.set("location", location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate a Yahoo Calendar URL for an event.
 */
export function getYahooCalendarUrl(event: CalendarEvent): string {
  const { title, description, location, startDate, endDate } = event;
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatDate(startDate);
  const end = endDate 
    ? formatDate(endDate) 
    : formatDate(new Date(startDate.getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    v: "60",
    title: title,
    st: start,
    et: end,
  });

  if (description) params.set("desc", description);
  if (location) params.set("in_loc", location);

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

// Export all calendar link generators
export const calendarLinks = {
  google: getGoogleCalendarUrl,
  outlook: getOutlookCalendarUrl,
  yahoo: getYahooCalendarUrl,
  ics: downloadICS,
};

export default calendarLinks;
