# KinetiK TBD (Missing Features & Product Roadmap)

## Critical Functional Gaps (Must-Have)

- [ ] **Event Discovery & Filtering**
  - **Problem:** Volunteers only see "Recommended" events (AI/mock). There is no "Browse All" or search page.
  - **Solution:** Create `app/(protected)/events/page.tsx` with search, filters (location, date, skills), and pagination.

- [ ] **Application Status Notifications**
  - **Problem:** When an organizer accepts a volunteer, the volunteer has no way of knowing unless they check the dashboard.
  - **Solution:** Implement in-app notifications (bell icon) + optional email triggers (via Firebase Extensions or SendGrid).

- [ ] **Volunteer History / My Applications**
  - **Problem:** Dashboard only shows basic stats. No dedicated view to see past events, hours logged, or detailed application history.
  - **Solution:** Create `app/(protected)/applications/page.tsx` (linked in nav but might be incomplete) to list all applications with status history.

- [ ] **Event Management (Edit/Delete)**
  - **Problem:** Organizers can create events but cannot edit or delete them if they make a mistake.
  - **Solution:** Add "Edit" and "Cancel Event" actions to the Organizer Dashboard.

## "Amazing Product" Polish (Should-Have)

- [ ] **Gamification System**
  - **Problem:** "Reputation Score" is currently hardcoded/mocked in `backend/main.py`.
  - **Solution:** Implement real logic: +10 pts for applying, +50 for completing an event, +5 per hour. Store in Neo4j.

- [ ] **Reviews & Ratings**
  - **Problem:** No trust signals.
  - **Solution:** 
    - Organizers rate volunteers (Reliability, Skills).
    - Volunteers rate events (Organization, Impact).
    - Display average ratings on profiles.

- [ ] **Organizer Profiles / Organization Pages**
  - **Problem:** Volunteers apply to "Events", not "Organizations". No way to see who is behind an event.
  - **Solution:** Enhance Organizer profile to look like an "Organization Page" (Logo, Mission, Active Events).

- [ ] **Calendar Integration**
  - **Feature:** "Add to Google Calendar" button for accepted events.

- [ ] **Social Sharing**
  - **Feature:** "Share this event" button (Copy Link, Twitter, LinkedIn) with OG images.

## Technical Debt & Cleanup

- [ ] **Settings Page**
  - **Status:** Blocked by environment permissions (directory creation). Needs to be implemented when environment allows.
  - **Scope:** Account deletion, password reset, notification preferences.

- [ ] **GitHub Login**
  - **Status:** UI is ready, backend needs Firebase Console configuration.

## Recent Completions

- [x] **Profile Editing:** Implemented `PATCH /api/users/{id}` and UI.
- [x] **Error Handling:** Standardized with Toasts.
- [x] **Security:** Enforced backend token verification.
- [x] **Role Persistence:** Fixed login/signup flow.
