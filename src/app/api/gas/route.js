// src/app/api/gas/route.js
// ── GAS Proxy — Browser → Vercel (same origin, no CORS) → GAS
// GAS ContentService မှာ CORS header ထည့်မရသောကြောင့်
// Server-side fetch ဖြင့် proxy လုပ်ခြင်း

const GAS_URL =
  process.env.NEXT_PUBLIC_WEB_APP_URL ||
  "https://script.google.com/macros/s/AKfycbwebk9Jh15hK4ioWmbHySroAU5mc8gRFeyHwvIHQTIX7_os13S6qQR4cXz5DtDPHVM5/exec";

export async function POST(request) {
  try {
    const body = await request.text();

    const gasRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });

    const text = await gasRes.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Proxy error: " + err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  try {
    const gasRes = await fetch(GAS_URL);
    const text = await gasRes.text();
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
