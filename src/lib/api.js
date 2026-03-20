/**
 * Shining Stars - Master API Config (v9.0 Proxy)
 * ROLE: Permanent Data Bridge
 *
 * ── CORS Fix ──────────────────────────────────────────────────────
 * GAS (ContentService) မှာ Access-Control-Allow-Origin header ထည့်မရ
 * ဒါကြောင့် Vercel/browser မှ တိုက်ရိုက် GAS ခေါ်လျှင် CORS error ဖြစ်တယ်
 *
 * Solution: /api/gas proxy route မှတဆင့် ခေါ် (server-to-server = no CORS)
 *   Browser → /api/gas (same Vercel origin) → GAS script
 *
 * Local dev မှာ /api/gas route ကို Next.js ကိုင်ပေးလို့ CORS မပြဿနာ
 * ─────────────────────────────────────────────────────────────────
 */
export const WEB_APP_URL = "/api/gas";

export const GIDS = {
  MANAGEMENT_LOGIN: 1500101923,
  STAFF_LOGIN: 0,
  STUDENT_LOGIN: 1858106882,
  STAFF_DIR: 668404503,
  STUDENT_DIR: 1807615173
};

export const TABS = {
  FEES:          "Fees_Management",
  ANNOUNCEMENTS: "Announcements",
  SCORES:        "Exam_Records",      // ✅ Fixed: was "Score_Records"
  EVENTS:        "Events_Calendar",
  NOTES:         "Student_Notes_Log"
  // ATTENDANCE removed — Attendance_Log sheet မရှိပါ (Leave_Records မှ derive)
};