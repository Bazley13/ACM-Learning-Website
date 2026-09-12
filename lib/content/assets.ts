// 把 content/ 下的「证书图片」与「实验台资源」映射为可公开访问的静态资产。
// 由自定义 server（server.ts）在 Next 之前拦截这些虚拟路径并回文件。
// 安全要点：只允许白名单前缀，防止路径穿越访问任意文件。

import fs from "node:fs";
import path from "node:path";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const ASSET_PREFIXES = {
  // /awards-assets/xxx.jpg      -> content/awards/images/xxx.jpg
  "/awards-assets/": path.join(CONTENT_ROOT, "awards", "images"),
  // /lab-assets/<id>/<file>     -> content/visualization-format/labs/<id>/<file>
  "/lab-assets/": path.join(CONTENT_ROOT, "visualization-format", "labs"),
  // /notes-assets/<cat>/images/x -> content/notes/<cat>/images/x
  "/notes-assets/": path.join(CONTENT_ROOT, "notes"),
} as const;

/**
 * 把请求 URL pathname 解析为磁盘绝对路径；不可访问时返回 undefined。
 * @param urlPath 例如 /awards-assets/2024-icpc.jpg
 */
export function resolveAssetPath(urlPath: string): string | undefined {
  for (const [prefix, mappedRoot] of Object.entries(ASSET_PREFIXES)) {
    if (urlPath.startsWith(prefix)) {
      const rel = urlPath.slice(prefix.length);
      // 路径穿越防护：./.. 解析后不得越出 mappedRoot
      const abs = path.resolve(mappedRoot, ...rel.split("/").filter(Boolean));
      const rootReal = path.resolve(mappedRoot);
      if (!abs.startsWith(rootReal + path.sep) && abs !== rootReal) {
        return undefined;
      }
      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        return undefined;
      }
      return abs;
    }
  }
  return undefined;
}
