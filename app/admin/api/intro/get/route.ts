import { NextRequest, NextResponse } from "next/server";
import { getIntro } from "@/lib/content/loader";

/** GET /admin/api/intro/get —— 返回当前简介用于编辑回填 */
export function GET(_req: NextRequest) {
  return NextResponse.json(getIntro());
}
