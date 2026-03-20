export const dynamic = "force-dynamic";

const GAS =
  process.env.GAS_URL ||
  "https://script.google.com/macros/s/AKfycbwebk9Jh15hK4ioWmbHySroAU5mc8gRFeyHwvIHQTIX7_os13S6qQR4cXz5DtDPHVM5/exec";

const H = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: H });
}

export async function GET() {
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
