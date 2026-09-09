"use client";

import { useEffect, useRef, useState } from "react";
import type { Visualization } from "@/lib/content/types";

// 语义色令牌 -> 具体色的映射（含深色主题下取值）
const TOKEN_COLOR: Record<string, string> = {
  compare: "var(--amber)",
  current: "var(--accent2)",
  visited: "var(--text-dim)",
  sorted: "var(--green)",
  swap: "var(--red)",
  error: "var(--red)",
  default: "var(--accent)",
};

interface Bar {
  value: string;
  color: string;
}

/** 计算第 frameIndex 帧时数组/标记的累积状态 */
function computeState(viz: Visualization, frameIndex: number) {
  const data = [...viz.data];
  const colorMap: Record<number, string> = {};
  let pointers: { name: string; index: number }[] = [];

  // 首帧前的 init
  for (const p of viz.init?.pointers ?? []) pointers.push({ name: p.name, index: p.index });
  for (const m of viz.init?.marks ?? []) {
    for (const idx of m.indices) colorMap[idx] = TOKEN_COLOR[m.color ?? "default"];
  }

  const frames = viz.steps.slice(0, frameIndex + 1);
  for (const frame of frames) {
    // set / swap 改变数组值
    if (frame.set) for (const s of frame.set) data[s.index] = s.value;
    if (frame.swap) {
      const tmp = data[frame.swap.a];
      data[frame.swap.a] = data[frame.swap.b];
      data[frame.swap.b] = tmp;
    }
    // pointers 全量覆盖
    if (frame.pointers) pointers = frame.pointers.map((p) => ({ name: p.name, index: p.index }));
    // marks 增量覆盖色
    if (frame.marks) {
      for (const m of frame.marks) {
        for (const idx of m.indices) colorMap[idx] = TOKEN_COLOR[m.color ?? "default"];
      }
    }
  }
  return { data, colorMap, pointers };
}

export default function VizPlayer({ viz }: { viz: Visualization }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = viz.steps.length;
  const { data, colorMap, pointers } = computeState(viz, frame);
  const cur = viz.steps[frame];

  // 自动播放
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= total - 1) {
          setPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, total]);

  const maxVal = Math.max(...viz.data.filter((d): d is number => typeof d === "number"), 1);

  return (
    <div>
      <div className="viz-stage" style={{ alignItems: "flex-end" }}>
        {data.map((v, i) => {
          const num = typeof v === "number" ? v : 0;
          const h = typeof v === "number" ? Math.round((num / maxVal) * 200 + 12) : 40;
          return (
            <div
              key={i}
              className="bar"
              style={{
                height: `${h}px`,
                background: colorMap[i] ?? "var(--accent)",
                position: "relative",
              }}
              title={`[${i}] ${v}`}
            >
              <span style={{ position: "absolute", top: -22, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "var(--text-dim)" }}>
                {v}
              </span>
            </div>
          );
        })}
      </div>

      {/* 指针指示 */}
      {pointers.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 10, fontSize: 13 }}>
          {pointers.map((p) => (
            <span key={p.name} className="badge current">
              {p.name}={p.index}
            </span>
          ))}
        </div>
      )}

      {/* 控制 */}
      <div className="viz-controls">
        <button
          className="btn"
          onClick={() => {
            if (playing) setPlaying(false);
            else setFrame((f) => (f >= total - 1 ? 0 : f)), setPlaying(true);
          }}
        >
          {playing ? "暂停" : "播放"}
        </button>
        <button className="btn ghost" onClick={() => setFrame(0)}>
          重置
        </button>
        <button className="btn ghost" onClick={() => setFrame((f) => Math.max(0, f - 1))}>
          ‹ 上一步
        </button>
        <button className="btn ghost" onClick={() => setFrame((f) => Math.min(total - 1, f + 1))}>
          下一步 ›
        </button>
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-dim)" }}>
          速度
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span>{frame + 1}/{total}</span>
        </label>
      </div>

      {/* 讲解文案 */}
      <div className="viz-note">{cur?.note ?? "（本帧无文案）"}</div>
    </div>
  );
}
