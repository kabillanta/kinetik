"use client";

import useSWR, { SWRConfiguration } from "swr";
import { getAuth } from "firebase/auth";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * SWR fetcher with Firebase auth token
 */
async function authFetcher<T>(url: string): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { headers });

  if (!res.ok) {
    const error = new Error("API request failed");
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * Default SWR configuration for KinetiK
 */
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  errorRetryInterval: 2000,
};

/**
 * Hook for fetching volunteer dashboard data
 */
export function useVolunteerDashboard(userId: string | undefined) {
  return useSWR(
    userId ? `/api/volunteers/${userId}/dashboard` : null,
    authFetcher,
    {
      ...defaultConfig,
      revalidateOnMount: true,
    }
  );
}

/**
 * Hook for fetching volunteer applications
 */
export function useVolunteerApplications(userId: string | undefined) {
  return useSWR(
    userId ? `/api/volunteers/${userId}/applications` : null,
    authFetcher,
    defaultConfig
  );
}

/**
 * Hook for fetching volunteer history
 */
export function useVolunteerHistory(userId: string | undefined) {
  return useSWR(
    userId ? `/api/volunteers/${userId}/history` : null,
    authFetcher,
    defaultConfig
  );
}

/**
 * Hook for fetching volunteer analytics
 */
export function useVolunteerAnalytics(userId: string | undefined) {
  return useSWR(
    userId ? `/api/volunteers/${userId}/analytics` : null,
    authFetcher,
    {
      ...defaultConfig,
      dedupingInterval: 60000, // Analytics can be cached longer
    }
  );
}

/**
 * Hook for fetching organizer dashboard data
 */
export function useOrganizerDashboard(userId: string | undefined) {
  return useSWR(
    userId ? `/api/organizers/${userId}/dashboard` : null,
    authFetcher,
    {
      ...defaultConfig,
      revalidateOnMount: true,
    }
  );
}

/**
 * Hook for fetching organizer events
 */
export function useOrganizerEvents(userId: string | undefined) {
  return useSWR(
    userId ? `/api/organizers/${userId}/events` : null,
    authFetcher,
    defaultConfig
  );
}

/**
 * Hook for fetching event recommendations
 */
export function useRecommendations(
  userId: string | undefined,
  limit: number = 10
) {
  return useSWR(
    userId ? `/api/recommendations/${userId}?limit=${limit}` : null,
    authFetcher,
    {
      ...defaultConfig,
      dedupingInterval: 60000, // Recommendations can be cached longer
    }
  );
}

/**
 * Hook for fetching event details
 */
export function useEventDetails(eventId: string | undefined) {
  return useSWR(
    eventId ? `/api/events/${eventId}` : null,
    authFetcher,
    defaultConfig
  );
}

/**
 * Hook for fetching user profile
 */
export function useUserProfile(userId: string | undefined) {
  return useSWR(
    userId ? `/api/users/${userId}` : null,
    authFetcher,
    {
      ...defaultConfig,
      dedupingInterval: 60000,
    }
  );
}

/**
 * Hook for fetching user reviews
 */
export function useUserReviews(userId: string | undefined) {
  return useSWR(
    userId ? `/api/reviews/users/${userId}` : null,
    authFetcher,
    {
      ...defaultConfig,
      dedupingInterval: 60000,
    }
  );
}

/**
 * Hook for fetching user review stats
 */
export function useUserReviewStats(userId: string | undefined) {
  return useSWR(
    userId ? `/api/reviews/users/${userId}/stats` : null,
    authFetcher,
    {
      ...defaultConfig,
      dedupingInterval: 120000, // Stats change infrequently
    }
  );
}

/**
 * Generic authenticated SWR hook
 */
export function useAuthSWR<T>(
  key: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(key, authFetcher, {
    ...defaultConfig,
    ...config,
  });
}

export { authFetcher, defaultConfig };
