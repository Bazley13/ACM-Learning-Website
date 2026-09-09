// 纯 URL 工具：只拼字符串，不 import 任何 Node 模块（node:fs / node:path）。
// 目的是让客户端组件（"use client"，如 LabHost）能安全 import 这里，
// 而不把服务器端 Node API 带进浏览器包。
// 注意：本文件里不要 import 任何带 node: 前缀的东西，否则又会触发 webpack UnhandledSchemeError。

/** 实验台入口 HTML 的公开 URL */
export function labEntryUrl(id: string, entry: string): string {
  return `/lab-assets/${id}/${entry}`;
}

/** 荣誉墙图片路径 -> 公开 URL（content/awards/images/xxx -> /awards-assets/xxx） */
export function awardImagePublicPath(rel: string): string {
  const base = rel.split("/").filter(Boolean).pop() ?? rel;
  return `/awards-assets/${base}`;
}
