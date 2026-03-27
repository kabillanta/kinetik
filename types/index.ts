// Shared TypeScript types for KinetiK

// User & Auth
export type UserRole = "volunteer" | "organizer";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole | null;
  skills: string[];
  location: string | null;
  bio: string | null;
  onboarding_completed: boolean;
  created_at?: string;
}

// Events
export type EventStatus = "OPEN" | "COMPLETED" | "CANCELLED";

export interface Event {
  id: string;
  title: string;
  description: string;
  role: string;
  location: string;
  date: string;
  time?: string;
  status: EventStatus;
  skills: string[];
  volunteers_needed: number;
  volunteers_filled: number;
  organizer_id: string;
  organizer_name?: string;
  created_at?: string;
}

export interface EventWithMatch extends Event {
  match_score?: number;
  matching_skills?: string[];
}

// Applications
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Application {
  id: string;
  event_id: string;
  volunteer_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at?: string;
}

export interface ApplicationWithDetails extends Application {
  event?: Event;
  volunteer?: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    reputation: number;
  };
}

// Dashboard Stats
export interface VolunteerDashboardStats {
  applications: number;
  hours_volunteered: number;
  events_completed: number;
  reputation: number;
  upcoming_events: Event[];
  recent_applications: ApplicationWithDetails[];
}

export interface OrganizerDashboardStats {
  total_events: number;
  active_events: number;
  total_volunteers: number;
  pending_applications: number;
  upcoming_events: Event[];
}

// Notifications
export type NotificationType = 
  | "APPLICATION_RECEIVED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "EVENT_REMINDER"
  | "EVENT_CANCELLED";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  event_id?: string;
  read: boolean;
  created_at: string;
}

// Skills
export interface Skill {
  name: string;
  category?: string;
  count?: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface ApiSuccessResponse {
  status: "success";
  message: string;
}

export interface ApiErrorResponse {
  detail: string;
  status?: number;
}

// Recommendations
export interface EventRecommendation extends Event {
  score: number;
  match_reasons: string[];
}

// Analytics (Organizer)
export interface OrganizerAnalytics {
  total_events: number;
  total_volunteers: number;
  total_hours: number;
  acceptance_rate: number;
  top_skills: { skill: string; count: number }[];
  events_by_month: { month: string; count: number }[];
}
