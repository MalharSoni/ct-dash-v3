import { NextResponse } from "next/server";

const COOKIE = "ctd-pass";

export async function POST(req: Request) {
  const expected = process.env.COACH_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: true, message: "No password configured." });
  }

  const body = await req.json().catch(() => ({}));
  const presented = typeof body?.password === "string" ? body.password : "";

  if (presented !== expected) {
    return NextResponse.json(
      { ok: false, message: "Wrong password." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, expected, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
