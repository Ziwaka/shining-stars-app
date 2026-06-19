import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  { prefix: "/management", roles: ["management"] },
  { prefix: "/staff", roles: ["staff", "management"] },
  { prefix: "/student", roles: ["student"] },
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("ssmt_role")?.value;
  const protectedRoute = PROTECTED_ROUTES.find(route => pathname.startsWith(route.prefix));

  if (protectedRoute && !protectedRoute.roles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    "/management/:path*",
    "/staff/:path*",
    "/student/:path*",
    "/api/gas/:path*",
  ],
};
