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
 * 证书图片：GET /awards-assets/xxx.jpg
 * 仅读 content/awards/images/ 下文件，防路径穿越由 resolveAssetPath 保证。
 */
export function GET(
  _req: NextRequest,
  { params }: { params: { file: string[] } }
) {
  const urlPath = "/awards-assets/" + params.file.join("/");
  const abs = resolveAssetPath(urlPath);
  if (!abs) return new NextResponse("Not Found", { status: 404 });

  const ext = abs.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
  const body = fs.readFileSync(abs);
  return new NextResponse(body, {
    headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
  });
}
