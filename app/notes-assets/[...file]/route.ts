import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { resolveAssetPath } from "@/lib/content/assets";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/**
 * 笔记图片：GET /notes-assets/<category>/images/<file>
 * 仅读 content/notes/ 下文件，路径穿越由 resolveAssetPath 保证。
 */
export function GET(
  _req: NextRequest,
  { params }: { params: { file: string[] } }
) {
  const urlPath = "/notes-assets/" + params.file.join("/");
  const abs = resolveAssetPath(urlPath);
  if (!abs) return new NextResponse("Not Found", { status: 404 });

  const ext = abs.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
  const body = fs.readFileSync(abs);
  return new NextResponse(body, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
