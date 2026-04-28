export const dynamic = "force-dynamic";

// ✅ NEXT_PUBLIC_WEB_APP_URL ကို သုံးပါ
const GAS = process.env.NEXT_PUBLIC_WEB_APP_URL;

const H = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: H });
}

export async function GET() {
  if (!GAS) {
    return new Response(JSON.stringify({ success: false, message: "GAS URL not configured" }), { status: 500, headers: H });
  }
  try {
    const r = await fetch(GAS, { cache: "no-store" });
    const t = await r.text();
    return new Response(t, { status: 200, headers: H });
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: e.message }),
      { status: 500, headers: H }
    );
  }
}

export async function POST(request) {
  if (!GAS) {
    return new Response(JSON.stringify({ success: false, message: "GAS URL not configured" }), { status: 500, headers: H });
  }
  try {
    const body = await request.text();
    const r = await fetch(GAS, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      cache: "no-store",
    });
    const t = await r.text();
    return new Response(t, { status: 200, headers: H });
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: e.message }),
      { status: 500, headers: H }
    );
  }
}