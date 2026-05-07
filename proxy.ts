import { NextRequest, NextResponse } from "next/server";

/**
 * Shared-password gate.
 *
 * If `COACH_PASSWORD` is set in env, every request must carry the cookie
 * `ctd-pass` with that exact value, otherwise it gets bounced to /unlock.
 *
 * Skipped:
 *   - /unlock        — the entry form itself
 *   - /c             — public curriculum link for parents
 *   - /api/unlock    — POST endpoint that sets the cookie
 *   - /_next/*, /api/auth/*, static asset extensions
 *
 * If COACH_PASSWORD is empty/unset (e.g. local dev), the gate is OFF.
 */
const COOKIE = "ctd-pass";
const PUBLIC_PATHS = new Set(["/unlock"]);

export function proxy(req: NextRequest) {
  const expected = process.env.COACH_PASSWORD;
  if (!expected) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allowlist
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname === "/c" || pathname.startsWith("/c/")) return NextResponse.next();
  if (pathname.startsWith("/api/unlock")) return NextResponse.next();
  if (pathname.startsWith("/_next/")) return NextResponse.next();
  if (pathname.startsWith("/logos/")) return NextResponse.next();
  if (
    /\.(png|svg|ico|jpg|jpeg|webp|gif|css|js|map|woff|woff2|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const presented = req.cookies.get(COOKIE)?.value;
  if (presented === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
