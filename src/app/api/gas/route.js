export const dynamic = "force-dynamic";

const GAS = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_WEB_APP_URL;
const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 25000;

const H = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: H });
}

export async function GET() {
  return json({ success: false, message: "Method not allowed" }, 405);
}

export async function POST(request) {
  if (!GAS) {
    return json({ success: false, message: "GAS URL not configured" }, 500);
  }

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return json({ success: false, message: "Request payload too large" }, 413);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const upstream = await fetch(GAS, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.ok ? 200 : upstream.status,
      headers: H,
    });
  } catch (e) {
    const isTimeout = e.name === "AbortError";
    return json(
      { success: false, message: isTimeout ? "GAS request timed out" : e.message },
      isTimeout ? 504 : 500
    );
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: H });
}
