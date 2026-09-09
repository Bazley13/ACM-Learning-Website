import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { resolveAssetPath } from "@/lib/content/assets";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/**
 * 注入 __LAB__ 桥的脚本。注入到入口 HTML 的 </head> 之前。
 * 这样小程序作者只需调用 window.__LAB__，无需自己接 postMessage（见 RUN-CONTRACT.md）。
 */
const LAB_BRIDGE_SCRIPT = `
<script>
(function () {
  var P = window.parent;
  var params = {};
  var runFns = [];
  var resetFns = [];
  window.__LAB__ = {
    hostApiVersion: "1.0",
    manifestId: document.currentScript && document.currentScript.getAttribute("data-lab-id") || "",
    getParam: function (name) { return params[name]; },
    onRun: function (fn) { runFns.push(fn); },
    onReset: function (fn) { resetFns.push(fn); },
    report: function (result) {
      if (P) P.postMessage({ type: "lab:result", result: result }, "*");
    }
  };
  window.addEventListener("message", function (ev) {
    var d = ev.data || {};
    if (d.type === "lab:set-params") {
      params = d.params || params;
    } else if (d.type === "lab:run") {
      runFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    } else if (d.type === "lab:reset") {
      resetFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
  });
  // 就绪后向父页面要一次参数（父页面回 lab:set-params）
  if (P) P.postMessage({ type: "lab:get-params" }, "*");
})();
<\/script>
`;

/**
 * 实验台资源：GET /lab-assets/<labId>/<entry 与依赖文件>
 * 入口 HTML 会被注入 __LAB__ 桥；其余静态文件原样返回。
 * 防路径穿越由 resolveAssetPath 保证。
 */
export function GET(
  _req: NextRequest,
  { params }: { params: { id: string; file: string[] } }
) {
  const rel = "/lab-assets/" + params.id + "/" + params.file.join("/");
  const abs = resolveAssetPath(rel);
  if (!abs) return new NextResponse("Not Found", { status: 404 });

  const ext = abs.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "";
  const headers: Record<string, string> = {
    "Content-Type": MIME["." + ext] ?? "application/octet-stream",
  };

  if (ext === "html" || ext === "htm") {
    let html = fs.readFileSync(abs, "utf8");
    const bridge = LAB_BRIDGE_SCRIPT.replace(
      'document.currentScript.getAttribute("data-lab-id")',
      '"' + params.id + '"'
    );
    if (html.includes("</head>")) {
      html = html.replace("</head>", bridge + "\n</head>");
    } else {
      html = "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>" + html + "</body></html>".replace("</head>", bridge + "\n</head>");
    }
    return new NextResponse(html, {
      headers: {
        ...headers,
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none';",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  }

  const body = fs.readFileSync(abs);
  return new NextResponse(body, { headers });
}
