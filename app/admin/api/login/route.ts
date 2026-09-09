import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  validateSessionToken,
  SESSION_COOKIE,
  EXPIRES_AT,
} from "@/lib/auth";

/** POST /admin/api/login { password } -> 设置 session cookie */
export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body.password || !verifyPassword(body.password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: EXPIRES_AT,
  });
  return res;
}

/** GET /admin/api/login-session { valid: boolean } */
export function GET(_req: NextRequest) {
  const raw = _req.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json({ valid: raw ? validateSessionToken(raw) : false });
}
