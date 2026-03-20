// src/app/api/gas/route.js
// ── GAS Proxy — Browser → Vercel (same origin) → GAS (server-to-server)
//
// ဘာကြောင့် proxy လုပ်ရတာ:
//   GAS ContentService က Access-Control-Allow-Origin header မထည့်နိုင်
//   Browser → GAS တိုက်ရိုက် = CORS block
//   Browser → /api/gas (same origin) → GAS = no CORS issue
//
// GAS POST quirk:
//   GAS webapp POST က တစ်ခါ 302 redirect လုပ်တတ်တယ် (script URL → exec URL)
//   Node fetch က redirect follow လုပ်တဲ့အခါ POST → GET ပြောင်းတတ်တယ် (HTTP spec 302 behavior)
//   Fix: redirect:manual → Location header ကို ကိုယ်တိုင် follow + POST ထပ်ပို့

const GAS_URL =
  process.env.GAS_URL ||
  process.env.NEXT_PUBLIC_WEB_APP_URL ||
  "https://script.google.com/macros/s/AKfycbwebk9Jh15hK4ioWmbHySroAU5mc8gRFeyHwvIHQTIX7_os13S6qQR4cXz5DtDPHVM5/exec";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

// POST body ကို GAS ဆီ ပို့ပြီး JSON text ပြန်ယူ
async function fetchGAS(body) {
  // Round 1 — POST to GAS, redirect manual
  const res1 = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
    redirect: "manual", // 302 ကို ကိုယ်တိုင် handle မယ်
  });

  // 302/303 redirect ဖြစ်ရင် Location ကို POST ထပ်လုပ်
  if (res1.status === 302 || res1.status === 303 || res1.status === 301) {
    const location = res1.headers.get("location");
    if (location) {
      const res2 = await fetch(location, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
        redirect: "follow",
      });
      return await res2.text();
    }
  }

  const text = await res1.text();

  // HTML response (Google login page etc.) ဖြစ်ရင် error ဖြန့်
  if (text.trim().startsWith("<!")) {
    throw new Error(
      `GAS returned HTML (status ${res1.status}). ` +
      "GAS deployment → 'Who has access' ကို 'Anyone' ထားပြီး re-deploy လုပ်ပါ။"
    );
  }

  return text;
}

export async function POST(request) {
  try {
    const body = await request.text();
    const text = await fetchGAS(body);
    return new Response(text, { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(GAS_URL, { redirect: "follow" });
    const text = await res.text();
    return new Response(text, { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

// OPTIONS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
