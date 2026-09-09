"use client";

import { useState, useRef, useCallback } from "react";
import type { LabManifest, LabParam } from "@/lib/content/types";
import { labEntryUrl } from "@/lib/content/urls";

/**
 * 实验台宿主组件。
 * - 在沙箱 iframe 中加载小程序的入口 HTML（labEntryUrl）。
 * - 注入 window.__LAB__（通过 iframe 加载前的 srcdoc 或在父页面 postMessage 桥）。
 * - 统一渲染参数面板 + 样例填充 + 运行/重置按钮。
 *
 * 安全要点：iframe sandbox="allow-scripts"（不加 allow-same-origin 等）。
 * 出于简单与首版可靠，采用「父页面持有参数 + postMessage 推给子 iframe」的方式，
 * 子 iframe 内再通过 __LAB__（由父页面注入的桥）读取参数。
 */

type LabStatus = Record<string, string>;

// 由 manifest 的 params 构造首帧默认值
function buildDefaults(manifest: LabManifest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of manifest.params ?? []) {
    out[p.name] = p.default === undefined ? "" : String(p.default);
  }
  return out;
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: LabParam;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (param.type) {
    case "select":
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {(param.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(String(e.target.checked))}
        />
      );
    case "color":
      return <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />;
    case "range":
      return (
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={Number(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          placeholder={param.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function LabHost({
  id,
  manifest,
}: {
  id: string;
  manifest: LabManifest;
}) {
  const [params, setParams] = useState<LabStatus>(() => buildDefaults(manifest));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [output, setOutput] = useState("");

  // 把参数推给子 iframe（沙箱内通过 __LAB__ 桥接收）
  const sendParams = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "lab:set-params", params },
      window.location.origin
    );
  }, [params]);

  const run = useCallback(() => {
    sendParams();
    iframeRef.current?.contentWindow?.postMessage({ type: "lab:run" }, window.location.origin);
  }, [sendParams]);

  const reset = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "lab:reset" }, window.location.origin);
  }, []);

  // 监听子 iframe 回报结果与请求参数
  const handleMessage = useCallback(
    (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      const data = ev.data as { type?: string; params?: LabStatus; result?: unknown };
      if (!data?.type) return;
      if (data.type === "lab:get-params") {
        sendParams();
      } else if (data.type === "lab:result") {
        setOutput(typeof data.result === "string" ? data.result : JSON.stringify(data.result));
      }
    },
    [sendParams]
  );

  return (
    <div>
      <div className="grid grid-2">
        {/* 实验台本尊（沙箱 iframe） */}
        <div className="lab-frame-wrap" style={{ gridColumn: "span 1" }}>
          <iframe
            ref={iframeRef}
            title={manifest.title}
            src={labEntryUrl(id, manifest.entry)}
            sandbox="allow-scripts"
            onLoad={() => {
              sendParams();
              // 每次加载都广播一次参数，避免子 iframe 先于桥就绪
              setTimeout(sendParams, 300);
            }}
            style={{ width: "100%", height: 460, border: "none", background: "#fff" }}
          />
        </div>

        {/* 参数面板 */}
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>参数与运行</h3>

          {(manifest.params ?? []).map((p) => (
            <div key={p.name}>
              <label>{p.label}</label>
              <ParamControl
                param={p}
                value={params[p.name] ?? ""}
                onChange={(v) => setParams((s) => ({ ...s, [p.name]: v }))}
              />
            </div>
          ))}

          {/* 样例填充 */}
          {(manifest.samples ?? []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label>预置样例</label>
              {(manifest.samples ?? []).map((s) => (
                <button
                  key={s.name}
                  className="btn ghost"
                  style={{ display: "block", width: "100%", marginBottom: 6 }}
                  onClick={() => {
                    const next: LabStatus = {};
                    for (const [k, v] of Object.entries(s.params)) next[k] = String(v);
                    setParams(next);
                    sendParams();
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn" onClick={run}>
              ▶ 运行
            </button>
            <button className="btn ghost" onClick={reset}>
              ↺ 重置
            </button>
          </div>

          {output && (
            <div className="viz-note" style={{ marginTop: 12 }}>
              <b>运行输出：</b>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
