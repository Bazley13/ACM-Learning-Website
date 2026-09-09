import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export function GET(_req: unknown) {
  const res = NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
