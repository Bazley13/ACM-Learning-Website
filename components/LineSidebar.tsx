"use client";

/**
 * LineSidebar —— 笔记目录侧边栏（忠实移植 ReactBits / reactbits.dev 的 LineSidebar）。
 * 活动项由父组件（滚动追踪）给出，经 rAF 指数缓动逐项刷新 --effect，
 * 实现游标线（marker）+ 序号 + 位移 + 颜色的连续动画。纯 React + CSS，无第三方依赖。
 * ⚠ 第三方开源组件，发布前请在交接文档确认许可条款。
 */
import { useEffect, useRef, type CSSProperties } from "react";

type Falloff = "linear" | "smooth" | "sharp";

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

export interface OutlineEntry {
  id: string;
  text: string;
  level: number; // 2 = 标题(h2)，3 = 子节(h3)
}

export interface LineSidebarProps {
  entries: OutlineEntry[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  activeId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

const LineSidebar = ({
  entries,
  accentColor = "#2563eb",
  textColor = "#94a3b8",
  markerColor = "#cbd5e1",
  showIndex = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 56,
  markerGap = 14,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 12,
  fontSize = 1.05,
  smoothing = 90,
  activeId = null,
  onSelect,
  className = "",
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const smoothingRef = useRef(smoothing);
  const activeIdRef = useRef(activeId);

  activeIdRef.current = activeId;
  smoothingRef.current = smoothing;

  const runFrame = (now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeIdRef.current === entries[i].id ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }
    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  };

  const startLoop = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  };

  useEffect(() => {
    startLoop();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, entries]);

  return (
    <nav
      className={`line-sidebar${scaleTick ? " line-sidebar--scale-tick" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          "--smoothing": `${smoothing}ms`,
        } as CSSProperties
      }
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={(e) => {
          const list = listRef.current;
          if (!list) return;
          const rect = list.getBoundingClientRect();
          const pointerY = e.clientY - rect.top;
          const curve = FALLOFF_CURVES[falloff];
          for (let i = 0; i < itemRefs.current.length; i++) {
            const el = itemRefs.current[i];
            if (!el) continue;
            const center = el.offsetTop + el.offsetHeight / 2;
            const distance = Math.abs(pointerY - center);
            targetsRef.current[i] = curve(Math.max(0, 1 - distance / proximityRadius));
          }
          startLoop();
        }}
        onPointerLeave={() => {
          targetsRef.current = targetsRef.current.map(() => 0);
          startLoop();
        }}
      >
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`line-sidebar__item${entry.level === 3 ? " line-sidebar__item--sub" : ""}`}
            aria-current={activeId === entry.id ? "true" : undefined}
            onClick={() => onSelect?.(entry.id)}
          >
            <span className="line-sidebar__marker" aria-hidden="true" />
            <span className="line-sidebar__label">
              {showIndex && (
                <span className="line-sidebar__index">{String(index + 1).padStart(2, "0")}</span>
              )}
              <span className="line-sidebar__text">{entry.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LineSidebar;
