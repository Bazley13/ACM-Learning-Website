"use client";

/**
 * AeroShardsCanvas —— 首屏 WebGPU 玻璃碎片背景的「特性检测」适配层。
 * 浏览器启用 WebGPU（navigator.gpu）才渲染真实 AeroShards；否则留空，
 * 由首屏深色渐变兜底，保证任何环境都不黑屏。
 */
import { useEffect, useState } from "react";
import AeroShards from "./AeroShards";

type AeroProps = Record<string, unknown>;

export default function AeroShardsCanvas(props: AeroProps) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    // 首屏只装一次；用户随后进入其它页面时保持已判定结果即可
    const has = typeof navigator !== "undefined" && !!(navigator as Navigator & { gpu?: unknown }).gpu;
    setOk(has);
  }, []);

  return (
    <div className="aero-shards-layer">
      {ok ? <AeroShards {...props} /> : null}
    </div>
  );
}
