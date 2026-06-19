# Shining Stars School Management App - Analysis & Refactor Report

## အကျဉ်းချုပ်

Project သည် Next.js frontend နှင့် Google Apps Script + Google Sheets backend ကို အသုံးပြုထားသော school management system ဖြစ်သည်။ Management, Staff, Student, Public Zone module များရှိပြီး route page file အများစုတွင် UI, data fetching, permission check, formatting helper, modal logic များ တစ်ဖိုင်ထဲ ပေါင်းနေသည်။

ဒီ refactor တွင် existing behavior မပျက်စေရန် shared foundation ကို အရင်တည်ဆောက်ခဲ့သည်။

- `src/features/users/auth` feature slice အသစ်
- role-based middleware
- shared auth storage/logout helper
- shared client-side `AuthGate`
- `/api/gas` proxy hardening
- Staff dashboard component extraction
- feature-based migration structure

## Codebase Findings

အရွယ်ကြီး route pages:

| Page | Approx size |
| --- | ---: |
| `src/app/management/calendar/page.js` | 96 KB |
| `src/app/staff/inventory/page.js` | 90 KB |
| `src/app/staff/hostel/inventory/page.js` | 60 KB |
| `src/app/staff/leave/page.js` | 51 KB |
| `src/app/management/mgt-dashboard/page.js` | 45 KB |
| `src/app/staff/hostel/page.js` | 38 KB |
| `src/app/staff/calendar/page.js` | 37 KB |
| `src/app/student/student-leave/page.js` | 36 KB |

Main bottlenecks:

- Route pages are doing too much: authentication, permission checks, API calls, formatting, calendar rendering, modals, charts, and form handling are mixed together.
- Many pages call `/api/gas` directly with repeated `fetch` boilerplate instead of a shared service layer.
- Permissions are checked in several different styles, increasing risk of inconsistent access.
- Auth is stored in browser storage only, so server-side middleware could not previously protect route entry.
- Large client components increase parse/evaluation time and make loading states harder to control.
- Some pages fetch several large sheets in parallel on first load even when the current view does not need all data immediately.

## Applied Changes

### 1. Feature-based folder structure

Added:

- `src/features/README.md`
- `src/features/users/auth/authStorage.js`
- `src/features/users/auth/AuthGate.js`
- `src/features/users/auth/index.js`
- `src/features/attendance/components.js`

This starts the migration pattern: route files stay under `src/app`, while feature logic moves under `src/features/<feature>`.

### 2. Authentication and logout cleanup

Added shared auth helpers:

- `readStoredUser()`
- `saveStoredUser()`
- `clearStoredUser()`
- `getDefaultPathForRole()`
- `normalizeUser()`

Login now saves both the existing browser-storage user and a lightweight role cookie. Logout clears browser storage and the role cookie together.

### 3. Role-based middleware

Added `src/middleware.js`.

Protected route rules:

- `/management/*` allows `management`
- `/staff/*` allows `staff` and `management`
- `/student/*` allows `student`

Middleware now adds security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Note: because the real auth record still lives in browser storage / GAS, this is an improvement but not a complete server-auth replacement. A future phase should issue signed HttpOnly session cookies from a server endpoint.

### 4. Client-side permission gate

Added `AuthGate`.

It centralizes role checks and optional page permission checks using existing `hasPageAccess()` / `hasPerm()` helpers. This is now used by management layout, student layout, and staff sidebar layout.

### 5. API proxy hardening

Reworked `src/app/api/gas/route.js`.

Improvements:

- Uses `GOOGLE_APPS_SCRIPT_URL` first, with old `NEXT_PUBLIC_WEB_APP_URL` as fallback.
- Blocks GET with `405 Method not allowed`.
- Adds request size limit of 1 MB.
- Adds upstream timeout of 25 seconds.
- Returns upstream HTTP failure status instead of always `200`.
- Adds cache/security/CORS headers.

### 6. Staff dashboard component extraction

Extracted the following from `src/app/staff/page.js` into `src/features/attendance/components.js`:

- `AttendanceCalendar`
- `EventCalendar`
- `AttendanceStats`
- `AbsentModal`
- `TrendChart`
- date display helpers

Result: `src/app/staff/page.js` is now much smaller and acts more like a route/controller.

### 7. Requested project structure alignment

The source tree now follows the requested high-level layout:

- `src/features/attendance`
- `src/features/calendar`
- `src/features/exam-records`
- `src/features/fees`
- `src/features/hostel`
- `src/features/inventory`
- `src/features/leave`
- `src/features/registry`
- `src/features/timetable`
- `src/features/users`
- `src/components/common`
- `src/components/forms`
- `src/components/tables`
- `src/components/modals`
- `src/components/layout`
- `src/services`
- `src/constants`

Existing shared files were moved into the new structure and imports were updated:

- Skeleton loaders -> `src/components/common/SkeletonLoader.js`
- Cache control -> `src/components/common/CacheControl.js`
- Staff sidebar layout -> `src/components/layout/Sidebar.js`
- Shared forms -> `src/components/forms`
- Leave UI helpers -> `src/features/leave/components`
- Auth helpers -> `src/features/users/auth`

### 8. Route pages split into feature modules

Large `src/app/**/page.js` files were moved into feature-owned page modules. The
route files now remain as thin wrappers so URLs and routing behavior stay the same.

Examples:

- `src/app/management/calendar/page.js` -> `src/features/calendar/ManagementCalendarPage.js`
- `src/app/staff/inventory/page.js` -> `src/features/inventory/StaffInventoryPage.js`
- `src/app/staff/hostel/inventory/page.js` -> `src/features/hostel/HostelInventoryPage.js`
- `src/app/staff/leave/page.js` -> `src/features/leave/StaffLeavePage.js`
- `src/app/management/mgt-dashboard/page.js` -> `src/features/users/ManagementDashboardPage.js`
- `src/app/management/exam-records/page.js` -> `src/features/exam-records/ManagementExamRecordsPage.js`
- `src/app/staff/fees/page.js` -> `src/features/fees/StaffFeesPage.js`
- `src/app/staff/timetable/page.js` -> `src/features/timetable/StaffTimetablePage.js`

After this split, protected management/staff/student route pages are generally tiny
wrappers, while implementation lives under `src/features`.

## Performance Notes

Short-term improvements already applied:

- Staff dashboard UI blocks are reusable and easier to lazy-load in the next phase.
- `/api/gas` requests now timeout instead of hanging indefinitely.
- Protected layouts can fail faster before rendering unauthorized page content.

Recommended next performance work:

1. Split `management/calendar/page.js` into `features/calendar`:
   - config hook
   - timetable grid component
   - event editor
   - calendar toolbar
   - API adapter

2. Split `staff/inventory/page.js` into `features/inventory`:
   - inventory table
   - item editor modal
   - bulk import panel
   - history drawer
   - inventory API adapter

3. Add route-level dynamic imports for rarely used heavy views:
   - event calendar
   - bulk upload/import tools
   - analytics charts
   - printable/export views

4. Replace repeated direct fetches with `apiService` or feature API adapters.

5. Use view-triggered fetching:
   - do not load logs/history until a user opens the log/history tab
   - do not load config sheets until an edit form opens

6. Add request de-duplication for repeated initial data calls.

## Security Notes

Improved:

- Route-level role redirect now exists in middleware.
- Logout clears both stored user and role cookie.
- API proxy no longer allows generic GET.
- Proxy now has payload limit and timeout.
- Security headers are applied to protected routes.

Still risky:

- User object and permissions are still stored client-side and can be edited by a user.
- GAS write actions appear to trust `userRole` / `staffId` values sent from the browser.
- No signed session token or server-verifiable identity was found.
- Password flow still depends on Google Apps Script implementation.

Recommended secure migration:

1. Add `/api/auth/login` in Next.js.
2. Let it call GAS login server-to-server.
3. On success, issue signed HttpOnly session cookie.
4. Store only non-sensitive display data client-side.
5. Make `/api/gas` verify session cookie before forwarding protected actions.
6. Enforce permissions server-side in GAS or in Next.js proxy before forwarding writes.

## Migration Plan

Phase 1 - Foundation: completed in this refactor.

- Add `features/users/auth`
- Add middleware
- Harden `/api/gas`
- Extract first route page components

Phase 2 - Shared data layer:

- Move repeated GAS calls into feature API adapters.
- Standardize error/loading states.
- Add request timeout helper for client fetches.

Phase 3 - Oversized route split:

- `features/calendar`
- `features/inventory`
- `features/hostel`
- `features/leave`
- `features/registry`

Phase 4 - Server-auth upgrade:

- Signed HttpOnly session
- middleware validates session
- proxy enforces permissions

Phase 5 - Performance:

- dynamic imports
- tab-level data loading
- bundle analysis
- table virtualization for large sheets

## Verification

Completed:

- Static code inspection across app routes and shared libraries.
- Node syntax checks passed for:
  - `src/middleware.js`
  - `src/app/api/gas/route.js`
  - `src/features/users/auth/authStorage.js`
  - `src/features/users/auth/index.js`

Not completed:

- Full `npm run lint` / `npm run build` could not be run because this shell does not have `npm` installed. The Codex bundled runtime has `node.exe`, but not npm.

## Changed Files

- `src/middleware.js`
- `src/app/api/gas/route.js`
- `src/app/login/page.js`
- `src/app/layout.js`
- `src/app/management/layout.js`
- `src/app/student/layout.js`
- `src/components/layout/Sidebar.js`
- `src/app/staff/page.js`
- `src/features/users/auth/authStorage.js`
- `src/features/users/auth/AuthGate.js`
- `src/features/users/auth/index.js`
- `src/features/attendance/components.js`
- `src/features/README.md`
