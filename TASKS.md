# TASKS.md — KinetiK Production Audit

> **Generated**: 2026-03-27  
> **Audit Scope**: Full-stack application (Next.js + FastAPI + Neo4j + Firebase)  
> **Product**: Volunteer-Event matching platform with graph-based skill recommendations

---

## 🔴 CRITICAL FIXES (must fix immediately)

### 1. ✅ **[SECURITY] Database Credentials Committed to Git** — FIXED
- **Location**: `backend/.env` contains credentials
- **Fix Applied**: 
  - Added `backend/.env` to `.gitignore`
  - Created `backend/.env.example` template
  - ⚠️ NOTE: Git history shows no prior commits of `.env` — credentials were never pushed

### 2. ✅ **[SECURITY] Debug Mode Auth Bypass** — FIXED
- **Location**: `backend/dependencies.py`
- **Fix Applied**: Removed `DEBUG_MODE` bypass entirely, added specific Firebase error handling (InvalidIdTokenError, ExpiredIdTokenError, RevokedIdTokenError)

### 3. ✅ **[AUTH] No Server-Side Route Protection** — FIXED
- **Location**: Created `middleware.ts`
- **Fix Applied**: Edge middleware with protected route patterns, security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)

### 4. ✅ **[AUTH] Race Condition in Onboarding Redirect Loop** — FIXED
- **Location**: `lib/auth-context.tsx`
- **Fix Applied**: Added `isPublicPath()` helper with full list: `/`, `/login`, `/signup`, `/about`, `/terms`, `/privacy`, `/support`, `/u/*`

### 5. ✅ **[DATA] Profile Fetch Errors Silently Block App** — FIXED
- **Location**: `lib/auth-context.tsx`
- **Fix Applied**: Added retry logic (3 retries with 2s exponential backoff), proper error fallback so users don't get stuck

### 6. ✅ **[BACKEND] Duplicate Exception Handlers (Dead Code)** — FIXED
- **Location**: `backend/routers/events.py`
- **Fix Applied**: Removed 4 duplicate `except HTTPException: raise` blocks

### 7. ✅ **[API] Missing Authorization Checks** — FIXED
- **Location**: `backend/routers/events.py`, `backend/routers/reviews.py`
- **Fix Applied**:
  - Added visibility check to `GET /events/{event_id}` - only OPEN events or events user participates in
  - Added participation verification to `POST /reviews` - both users must have participated
  - Added participation check to `GET /reviews/events/{event_id}/pending`

---

## 🟠 HIGH PRIORITY IMPROVEMENTS

### 8. ✅ **[API] Create Centralized API Client** — IMPLEMENTED
- **Location**: Created `lib/api-client.ts`
- **Implementation**: Full API client with token refresh, typed responses, convenience methods (`api.get`, `api.post`, etc.), proper error handling with `ApiError` class

### 9. ✅ **[STATE] Implement Data Caching with SWR/React Query** — IMPLEMENTED
- **Location**: Created `lib/hooks/useSWR.ts`
- **Implementation**:
  - SWR integration with Firebase auth token
  - Custom hooks for all major data endpoints (dashboard, applications, history, analytics)
  - Default configuration with deduping, error retry, and smart revalidation
  - Per-hook configuration for different caching strategies

### 10. ✅ **[CORS] Overly Permissive Backend CORS** — FIXED
- **Location**: `backend/main.py`
- **Fix Applied**: Restricted to `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]` and explicit headers `["Authorization", "Content-Type", "X-Requested-With", "X-User-ID"]`

### 11. ✅ **[ERROR] Add Global Error Boundary** — IMPLEMENTED
- **Location**: Created `components/ErrorBoundary.tsx`
- **Implementation**: Full error boundary with "Try Again" and "Reload Page" buttons, dev-mode error display, integrated into root layout

### 12. ✅ **[VALIDATION] Add Query Parameter Validation** — FIXED
- **Location**: `backend/routers/recommendations.py`
- **Fix Applied**: Added `Query()` validators with `ge=1, le=100` for limit, `ge=0` for skip, `max_length=200` for search_query

### 13. ✅ **[DRY] Extract Hardcoded Constants** — IMPLEMENTED
- **Location**: Created `backend/constants.py`
- **Implementation**: Centralized constants for roles, statuses, scoring values, limits, and recommendation weights

### 14. ✅ **[TYPES] Remove `any` Types and Add Shared Type Definitions** — IMPLEMENTED
- **Location**: Created `types/index.ts`
- **Implementation**: Full type definitions for Event, UserProfile, Application, Notification, Dashboard stats, API responses, etc.

---

## 🟡 PRODUCT FEATURES TO ADD

### 15. ✅ **[UX] Pagination / Infinite Scroll** — IMPLEMENTED
- **Location**: Created `lib/hooks/usePagination.tsx`
- **Implementation**: 
  - `usePagination` hook with page state, hasMore, loading states
  - `useInfiniteScroll` hook using Intersection Observer
  - `PaginationControls` component with page numbers
  - `LoadMoreButton` component for fallback

### 16. ✅ **[UX] Filters on Dashboards** — IMPLEMENTED
- **Location**: Created `lib/hooks/useFilters.tsx` and `components/ui/FilterBar.tsx`
- **Implementation**:
  - `useFilters` hook with URL sync support
  - `FilterBar` component with status, sort, date range, location, skills filters
  - Dropdown components with active filter tags
  - Clear all filters functionality

### 17. ✅ **[RETENTION] Email Notifications** — IMPLEMENTED
- **Location**: `backend/services/email.py`, `backend/routers/events.py`
- **Implementation**:
  - Email service with Resend API integration
  - Application confirmation email to volunteers
  - Status change notifications (accepted/rejected)
  - Review request emails after event completion
  - Organizer notification for new applications
  - Requires `EMAIL_ENABLED=true` and `RESEND_API_KEY` env vars

### 18. ✅ **[UX] Activity Log / Event History** — IMPLEMENTED
- **Location**: `backend/routers/volunteers.py`, `app/(protected)/history/page.tsx`
- **Implementation**:
  - Dedicated `/api/volunteers/{user_id}/history` endpoint with timestamps
  - CSV export functionality
  - PDF certificate generation using jsPDF
  - Review prompts for completed events
  - Timeline UI with status filters

### 19. ✅ **[UX] Search and Discovery Improvements** — IMPLEMENTED
- **Location**: Created `lib/hooks/useSearch.ts`
- **Implementation**:
  - `useSearch` hook with debouncing
  - Integrated into `FilterBar` component
  - Loading indicator during search

### 20. ✅ **[PRODUCT] Volunteer Reviews/Ratings** — IMPLEMENTED
- **Location**: `backend/routers/reviews.py`, `components/ui/ReviewModal.tsx`, `app/(protected)/history/page.tsx`, `app/(protected)/profile/page.tsx`
- **Implementation**:
  - Full review backend with star ratings (1-5)
  - ReviewModal component with direct API integration
  - Review prompts on completed events in history
  - Rating display on user profile pages
  - Review statistics (average, distribution)
  - Automatic average_rating updates on User nodes

### 21. ✅ **[PRODUCT] Calendar Integration** — IMPLEMENTED
- **Location**: Created `lib/calendar.ts` and `components/ui/AddToCalendar.tsx`
- **Implementation**:
  - ICS file generation and download
  - Google Calendar, Outlook, Yahoo Calendar URL generators
  - `AddToCalendar` dropdown component with all options

### 22. ✅ **[ANALYTICS] User Analytics Dashboard** — IMPLEMENTED
- **Location**: `backend/routers/volunteers.py`, `app/(protected)/analytics/page.tsx`
- **Implementation**:
  - Dedicated `/api/volunteers/{user_id}/analytics` endpoint
  - Real monthly activity data from Neo4j
  - Skill utilization breakdown
  - Community comparison stats (calculated from all volunteers)
  - Review statistics integration
  - Achievement badges system
  - Bar charts for activity trends

---

## 🔵 UX/UI IMPROVEMENTS

### 23. ✅ **[UX] Empty States Need Illustrations** — IMPLEMENTED
- **Location**: Created `components/ui/EmptyState.tsx`
- **Implementation**: Reusable EmptyState component with variants for events, applications, notifications, volunteers, search, history. Includes icons, CTAs, and customization options.

### 24. ✅ **[UX] Mobile FAB for Event Creation** — IMPLEMENTED
- **Location**: `app/(protected)/organizer/dashboard/page.tsx`
- **Implementation**: Added floating action button (FAB) visible only on mobile screens, positioned bottom-right with Plus icon

### 25. ✅ **[UX] Consistent Breadcrumb Navigation** — IMPLEMENTED
- **Location**: Created `components/ui/Breadcrumbs.tsx`
- **Implementation**: Breadcrumb component with Home icon, configurable items, pre-built configs for all pages. Added to applications and notifications pages.

### 26. ✅ **[UX] Skill Input Duplicate Feedback** — IMPLEMENTED
- **Location**: `app/(protected)/onboarding/page.tsx`
- **Implementation**: Shows warning toast "Skill already added" when user tries to add duplicate skill

### 27. ✅ **[UX] Disabled Button States** — IMPLEMENTED
- **Location**: All button components across the app
- **Implementation**: Added `disabled:cursor-not-allowed` alongside existing `disabled:opacity-50`

### 28. ✅ **[UX] Progress Bar on Signup** — IMPLEMENTED
- **Location**: `app/(public)/signup/page.tsx`
- **Implementation**: Added step indicator showing "Step 1 of 2" with animated progress dots

### 29. ✅ **[UX] Loading State During Search Debounce** — IMPLEMENTED
- **Location**: `lib/hooks/useSearch.ts` and `components/ui/FilterBar.tsx`
- **Implementation**: `isSearching` state in useSearch hook, spinner shown in FilterBar search input

### 30. ✅ **[UX] "Mark All as Read" for Notifications** — IMPLEMENTED
- **Location**: Updated `app/(protected)/notifications/page.tsx`
- **Implementation**: "Mark All as Read" button in header, batch marks all unread notifications

### 31. ✅ **[A11Y] Add ARIA Labels and Keyboard Navigation** — IMPLEMENTED
- **Location**: Multiple files (`layout.tsx`, `signup/page.tsx`, `login/page.tsx`, `onboarding/page.tsx`)
- **Implementation**:
  - Added `aria-label` to icon buttons (logout, mode toggle, back navigation)
  - Added `aria-pressed` to toggle buttons
  - Added `role="alert"` to error message containers
  - Added `aria-hidden="true"` to decorative icons

---

## 🟣 PERFORMANCE OPTIMIZATIONS

### 32. ✅ **[PERF] Use Next.js Image Component** - IMPLEMENTED
- **Location**: `app/(protected)/layout.tsx`, `app/(protected)/profile/page.tsx`, `app/(protected)/organizer/events/page.tsx`
- **Implementation**: Replaced all `<img>` tags with Next.js `<Image>` component for automatic optimization

### 33. ✅ **[PERF] Code-Split Lucide Icons** - NOT NEEDED
- **Analysis**: Current named import pattern (`import { X, Calendar } from 'lucide-react'`) already enables tree-shaking
- **Result**: Webpack/Turbopack only bundles used icons. Direct path imports would add complexity without benefit.

### 34. ✅ **[PERF] Consolidate Dashboard API Calls** - IMPLEMENTED
- **Location**: `app/(protected)/dashboard/page.tsx`, `app/(protected)/organizer/dashboard/page.tsx`
- **Implementation**: 
  - Volunteer dashboard uses `Promise.all` for parallel stats + recommendations fetch
  - Organizer dashboard uses single combined endpoint `/api/organizers/{uid}/dashboard`

### 35. ✅ **[PERF] Add Service Worker for Offline Support** - IMPLEMENTED
- **Location**: `public/sw.js`, `public/manifest.json`, `components/ServiceWorker.tsx`
- **Implementation**:
  - Service worker with stale-while-revalidate caching strategy
  - PWA manifest with app metadata
  - Apple Web App support
  - Offline fallback for navigation requests

### 36. ✅ **[BACKEND] Consolidate N+1 Queries in Organizer Dashboard** - IMPLEMENTED
- **Location**: `backend/routers/organizers.py`
- **Implementation**: Combined 3 separate DB calls into a single transaction with `begin_transaction()`, added proper logging

---

## ⚫ TECH DEBT / CLEANUP

### 37. ✅ **[DEBT] Remove ESLint Disable Comments** - FIXED
- **Location**: Multiple files
- **Implementation**:
  - Removed file-level `eslint-disable` from dashboard, profile, applications, events pages
  - Added proper TypeScript interfaces instead of `any`
  - Fixed `catch (err: any)` to `catch (err: unknown)` with proper type guards
  - Remaining: One intentional `react-hooks/exhaustive-deps` disable in auth-context (valid use case)

### 38. ✅ **[DEBT] Extract Inline Modal Components** - IMPLEMENTED
- **Location**: `app/(protected)/dashboard/page.tsx`
- **Implementation**: Replaced inline 30+ line modal with shared `ConfirmModal` component

### 39. ✅ **[DEBT] Standardize Error Response Shape** - IMPLEMENTED
- **Location**: `backend/main.py`, `backend/models/responses.py`
- **Implementation**:
  - Created `ErrorResponse` model with success, error, code fields
  - Added global `@app.exception_handler(HTTPException)` 
  - All HTTP exceptions now return consistent JSON shape

### 40. ✅ **[DEBT] Add Python Logging Framework** - IMPLEMENTED
- **Location**: `backend/main.py`, `backend/database.py`, `backend/dependencies.py`, all routers
- **Implementation**:
  - Configured logging with INFO level and timestamp format
  - Replaced all `print()` statements with `logger.info()` / `logger.error()`
  - Added `exc_info=True` for error logging with stack traces

### 41. ✅ **[DEBT] Fix Async/Sync Inconsistency in FastAPI** - FIXED
- **Location**: `backend/routers/events.py`, `backend/routers/users.py`
- **Implementation**: Changed `async def` to `def` for routes using sync Neo4j driver

### 42. ✅ **[DEBT] Add Response Models to All Endpoints** - IMPLEMENTED
- **Location**: `backend/models/responses.py`, all routers
- **Implementation**:
  - Created comprehensive response models (UserProfileResponse, EventResponse, ApplicationResponse, etc.)
  - Added `response_model` parameter to key endpoints
  - Improved API documentation auto-generation
```

### 43. ✅ **[DEBT] Create Shared Form Validation (Zod)** - IMPLEMENTED
- **Location**: `lib/validations.ts`
- **Implementation**:
  - Created Zod schemas for all forms (signup, login, event, profile, review)
  - Added `validateForm` helper function for reuse
  - Exported TypeScript types inferred from schemas

---

## 🟢 FUTURE / SCALE IDEAS

### 44. **[SCALE] Implement Role-Based Access Control (RBAC)**
- **Current**: Just volunteer/organizer binary
- **Future**: Admin role, event moderators, verified organizations
- **Long-term benefit**: Multi-tenant SaaS readiness

### 45. **[SCALE] Add Real-Time Features with WebSockets**
- **Current**: Polling-based notifications
- **Future**: Live notification badges, real-time application updates
- **Long-term benefit**: More engaging UX, reduced API calls

### 46. **[SCALE] Implement Event Categories/Tags System**
- **Current**: Just skills matching
- **Future**: Categories (Tech, Education, Environment), causes, SDG alignment
- **Long-term benefit**: Better discovery, marketing opportunities

### 47. **[SCALE] Add Organization/Team Accounts**
- **Current**: Individual organizers only
- **Future**: Teams can share events, multiple admins
- **Long-term benefit**: Enterprise readiness

### 48. **[SCALE] Implement Recommendation ML Model**
- **Current**: Graph-based skill matching
- **Future**: Collaborative filtering, past success predictions
- **Long-term benefit**: Higher engagement, better matches

### 49. **[SCALE] Add Multi-Language Support (i18n)**
- **Current**: English only
- **Future**: Internationalization with next-intl
- **Long-term benefit**: Global expansion ready

### 50. **[SCALE] Implement Event Templates**
- **Current**: Create from scratch each time
- **Future**: Save and reuse event templates
- **Long-term benefit**: Faster event creation for repeat organizers

---

## 📋 TEST COVERAGE REQUIREMENTS

### 51. **[TESTING] Add Unit Tests for Auth Context**
- **Why**: Most critical code path, currently untested
- **Minimum coverage**: 
  - Login flow
  - Profile fetch success/failure
  - Onboarding redirect logic

### 52. **[TESTING] Add API Integration Tests**
- **Why**: Only 2 basic tests exist (`backend/tests/test_main.py`)
- **Minimum coverage**:
  - All CRUD operations for events
  - Application flow (apply, accept, reject)
  - Recommendations endpoint

### 53. **[TESTING] Add E2E Tests with Playwright/Cypress**
- **Why**: No E2E tests, bugs in user flows go undetected
- **Minimum coverage**:
  - Signup → Onboarding → Dashboard flow
  - Organizer event creation flow
  - Volunteer application flow

---

## 📊 PRIORITY MATRIX

| Task # | Severity | Effort | Priority Score |
|--------|----------|--------|----------------|
| 1 | 🔴 Critical | Low | **P0 - NOW** |
| 2 | 🔴 Critical | Low | **P0 - NOW** |
| 3 | 🔴 Critical | Medium | **P0 - NOW** |
| 4 | 🔴 Critical | Low | **P0 - NOW** |
| 5 | 🔴 Critical | Medium | **P0 - NOW** |
| 6 | 🟠 High | Low | P1 - This Week |
| 7 | 🟠 High | Medium | P1 - This Week |
| 8 | 🟠 High | High | P1 - This Week |
| 9 | 🟠 High | High | P1 - This Week |
| 10 | 🟠 High | Low | P1 - This Week |
| 11 | 🟠 High | Medium | P1 - This Week |
| 12-14 | 🟡 Medium | Low-Med | P2 - This Sprint |
| 15-22 | 🟡 Medium | High | P3 - Roadmap |
| 23-31 | 🔵 Low | Low-Med | P3 - Polish |
| 32-36 | 🟣 Medium | Medium | P2 - Optimization |
| 37-43 | ⚫ Low | Medium | P4 - Maintenance |
| 44-50 | 🟢 Future | High | Backlog |
| 51-53 | 🟠 High | High | P2 - Quality |

---

*This audit assumes you're targeting production users. For hackathon/demo, focus only on P0 items.*
