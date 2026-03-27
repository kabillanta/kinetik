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

### 7. **[API] Missing Authorization Checks**
- **Location**: Multiple backend endpoints
- **Impact**: Any authenticated user can view any other user's dashboard/recommendations
- **Examples**:
  - `GET /api/organizers/{user_id}/dashboard` — checks `current_user != user_id` but should verify role
  - `GET /api/events/{event_id}` — requires auth but doesn't check if user should see this event
- **Fix**: Add role and ownership verification:
```python
@router.get("/{user_id}/dashboard")
def get_organizer_dashboard(user_id: str, current_user: str = Depends(get_current_user)):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Also verify user has organizer role in DB
```

---

## 🟠 HIGH PRIORITY IMPROVEMENTS

### 8. ✅ **[API] Create Centralized API Client** — IMPLEMENTED
- **Location**: Created `lib/api-client.ts`
- **Implementation**: Full API client with token refresh, typed responses, convenience methods (`api.get`, `api.post`, etc.), proper error handling with `ApiError` class

### 9. **[STATE] Implement Data Caching with SWR/React Query**
- **Location**: Every dashboard page refetches all data on mount
- **Why it matters**: Unnecessary API calls, slow navigation, stale data after mutations
- **Suggested implementation**:
```typescript
import useSWR from 'swr';

const { data: stats, mutate } = useSWR(
  user ? `/api/volunteers/${user.uid}/dashboard` : null,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 30000 }
);

// After mutation:
mutate(); // Revalidate
```

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

### 24. **[UX] Mobile FAB for Event Creation**
- **Issue**: "Create Event" only in desktop sidebar, hard to find on mobile
- **Fix**: Add floating action button on mobile organizer dashboard

### 25. ✅ **[UX] Consistent Breadcrumb Navigation** — IMPLEMENTED
- **Location**: Created `components/ui/Breadcrumbs.tsx`
- **Implementation**: Breadcrumb component with Home icon, configurable items, pre-built configs for all pages. Added to applications and notifications pages.

### 26. **[UX] Skill Input Duplicate Feedback**
- **Issue**: Adding duplicate skill silently fails
- **Fix**: Show toast: "Skill already added"

### 27. **[UX] Disabled Button States**
- **Issue**: `disabled:opacity-50` without `disabled:cursor-not-allowed`
- **Fix**: Update all buttons (partially done - new components include this)

### 28. **[UX] Progress Bar on Signup**
- **Issue**: Signup has steps but no visual progress indicator (unlike onboarding)
- **Fix**: Reuse onboarding progress bar component

### 29. ✅ **[UX] Loading State During Search Debounce** — IMPLEMENTED
- **Location**: `lib/hooks/useSearch.ts` and `components/ui/FilterBar.tsx`
- **Implementation**: `isSearching` state in useSearch hook, spinner shown in FilterBar search input

### 30. ✅ **[UX] "Mark All as Read" for Notifications** — IMPLEMENTED
- **Location**: Updated `app/(protected)/notifications/page.tsx`
- **Implementation**: "Mark All as Read" button in header, batch marks all unread notifications

### 31. **[A11Y] Add ARIA Labels and Keyboard Navigation**
- **Issue**: No ARIA labels, inconsistent keyboard navigation
- **Fix**:
  - Add `aria-label` to icon buttons
  - Ensure Tab order is logical
  - Add `role="alert"` to error messages

---

## 🟣 PERFORMANCE OPTIMIZATIONS

### 32. **[PERF] Use Next.js Image Component**
- **Issue**: Raw `<img>` tags cause layout shift and no optimization
- **Location**: `app/(protected)/layout.tsx` line 248, profile pages
- **Fix**:
```tsx
import Image from 'next/image';
<Image 
  src={imageUrl} 
  alt="Profile" 
  width={128} 
  height={128} 
  className="rounded-full object-cover"
/>
```

### 33. **[PERF] Code-Split Lucide Icons**
- **Issue**: Importing 18+ icons even when only 4 used
- **Fix**: Dynamic imports or direct imports:
```tsx
// Instead of: import { Calendar, User, ... } from 'lucide-react';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
```

### 34. **[PERF] Consolidate Dashboard API Calls**
- **Issue**: Volunteer dashboard makes 2 parallel API calls (stats + recommendations)
- **Fix**: Backend combined endpoint or parallel Promise.all with loading coordination:
```typescript
const [stats, events] = await Promise.all([
  fetchStats(),
  fetchEvents()
]);
```

### 35. **[PERF] Add Service Worker for Offline Support**
- **Issue**: App completely fails offline
- **Fix**: Next.js PWA plugin with basic caching

### 36. **[BACKEND] Consolidate N+1 Queries in Organizer Dashboard**
- **Issue**: `backend/routers/organizers.py` makes 3 separate DB calls per request
- **Fix**: Combine into single Cypher query or batch transaction

---

## ⚫ TECH DEBT / CLEANUP

### 37. **[DEBT] Remove ESLint Disable Comments**
- **Issue**: 8+ files have `eslint-disable` at top
- **Fix**: Fix underlying issues (type any, unescaped entities) properly

### 38. **[DEBT] Extract Inline Modal Components**
- **Issue**: Dashboard has 30+ line modal inline instead of using `ConfirmModal`
- **Fix**: Use shared component:
```tsx
<ConfirmModal
  isOpen={!!selectedEventToApply}
  title="Confirm Application"
  message={`Apply for "${selectedEventToApply?.title}"?`}
  onConfirm={handleApply}
  onCancel={() => setSelectedEventToApply(null)}
/>
```

### 39. **[DEBT] Standardize Error Response Shape**
- **Issue**: Backend returns `{detail: ...}` sometimes, `{message: ...}` other times
- **Fix**: Create standard error model:
```python
class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: Optional[str] = None

@app.exception_handler(HTTPException)
def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.detail).dict()
    )
```

### 40. **[DEBT] Add Python Logging Framework**
- **Issue**: `print()` statements scattered (13+ occurrences)
- **Fix**:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Neo4j driver initialized")
logger.error("Database error", exc_info=True)
```

### 41. **[DEBT] Fix Async/Sync Inconsistency in FastAPI**
- **Issue**: Routes marked `async def` but use sync Neo4j driver (blocking)
- **Fix**: Either use sync `def` or migrate to async Neo4j driver

### 42. **[DEBT] Add Response Models to All Endpoints**
- **Issue**: No `response_model` = no auto-documentation
- **Fix**:
```python
class UserResponse(BaseModel):
    uid: str
    name: str
    email: str
    role: str

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_profile(...):
```

### 43. **[DEBT] Create Shared Form Validation (Zod)**
- **Issue**: Form validation is HTML5 `required` only
- **Fix**: Add Zod schemas:
```typescript
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(5000),
  date: z.string().datetime(),
  skills: z.array(z.string()).max(20),
});
```

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
