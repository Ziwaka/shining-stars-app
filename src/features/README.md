# Feature structure

This folder is the migration target for feature-owned code. Route files stay in
`src/app/**`, while reusable domain logic moves here.

- `attendance/` contains attendance dashboard UI extracted from `src/app/staff/page.js`.
- `leave/components/` contains leave analysis, approval, history, and print helpers.
- `users/auth/` contains shared login, logout, route guard, and role helpers.

Planned slices:

- `calendar/`
- `exam-records/`
- `fees/`
- `hostel/`
- `inventory/`
- `registry/`
- `timetable/`
