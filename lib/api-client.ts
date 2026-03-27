import { auth } from "./firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(detail: string, status: number) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface ApiCallOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | FormData | string;
  skipAuth?: boolean;
}

/**
 * Centralized API client with automatic token handling and error parsing.
 * 
 * @param endpoint - API endpoint (e.g., "/users/me")
 * @param options - Fetch options with optional body object
 * @returns Parsed JSON response
 * @throws ApiError on non-2xx responses
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { body, skipAuth = false, ...fetchOptions } = options;

  // Get fresh token if user is authenticated
  let token: string | null = null;
  if (!skipAuth) {
    const user = auth.currentUser;
    if (user) {
      try {
        // Force refresh token if close to expiry
        token = await user.getIdToken(true);
      } catch (error) {
        console.error("Failed to get ID token:", error);
        // Continue without token - let backend handle auth error
      }
    }
  }

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Set content type for JSON bodies
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add auth header if we have a token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Handle auth errors specifically
  if (res.status === 401) {
    // Token expired or invalid - user needs to re-authenticate
    console.warn("Auth token rejected by API");
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  if (!res.ok) {
    let errorDetail = "Request failed";
    try {
      const errorBody = await res.json();
      errorDetail = errorBody.detail || errorBody.message || errorDetail;
    } catch {
      // Response wasn't JSON, use status text
      errorDetail = res.statusText || errorDetail;
    }
    throw new ApiError(errorDetail, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiCallOptions, "method" | "body">) =>
    apiCall<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<ApiCallOptions, "method">) =>
    apiCall<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<ApiCallOptions, "method">) =>
    apiCall<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<ApiCallOptions, "method">) =>
    apiCall<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: Omit<ApiCallOptions, "method" | "body">) =>
    apiCall<T>(endpoint, { ...options, method: "DELETE" }),
};
