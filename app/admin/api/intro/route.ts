import { NextRequest, NextResponse } from "next/server";
import { writeContent } from "@/lib/admin-guard";

/** POST /admin/api/intro { intro: {...} } —— 直接覆盖 content/intro.json */
export async function POST(req: NextRequest) {
  let body: { intro?: object };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const res = writeContent(req, {
    relFilePath: "content/intro.json",
    data: body.intro ?? {},
    schema: "intro",
    commitMsg: "工作室简介",
    jsonFile: true,
  });
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
