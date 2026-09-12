"use client";

/**
 * DepthCarousel —— 3D 深度轮播（纯 CSS/React，无 gsap 依赖）。
 * 仿 ReactBits 的 DepthCarousel 观感：照片以透视绕成一圈（纵深层次），
 * 自动缓慢旋转，鼠标悬停暂停、可左右步进。原组件依赖 gsap，这里用轻量实现。
 * 第三方观感，发布前请确认归属（RUNNING.md）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DepthItem {
  id: string;
  title: string;
  caption?: string;
  image?: string; // 公开资产路径，无则用渐变占位
  emoji?: string;
  accent?: string;
}

export default function DepthCarousel({
  items,
  depth = 260,
  radius = 300,
}: {
  items: DepthItem[];
  depth?: number;
  radius?: number;
}) {
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const stopped = useRef(false);
  const angleRef = useRef(0);

  const step = 360 / Math.max(1, items.length);

  // 自动缓慢旋转（悬停暂停）
  useEffect(() => {
    if (items.length === 0) return;
    let raf: number;
    const start = Date.now();
    const loop = () => {
      if (!stopped.current) {
        const t = (Date.now() - start) / 1000;
        angleRef.current = (t * 4) % 360; // 4°/s
        setAngle(angleRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  const go = useCallback(
    (dir: 1 | -1) => {
      stopped.current = true;
      angleRef.current += dir * step;
      setAngle(angleRef.current);
    },
    [step]
  );

  if (items.length === 0) return null;

  return (
    <div
      className="dc-scene"
      onMouseEnter={() => {
        stopped.current = true;
        setHovered(true);
      }}
      onMouseLeave={() => {
        stopped.current = false;
        setHovered(false);
      }}
    >
      <div className="dc-ring" style={{ transform: `rotateY(${-angle}deg)` }}>
        {items.map((it, i) => (
          <figure
            key={it.id}
            className="dc-card"
            style={{
              transform: `rotateY(${i * step}deg) translateZ(${depth}px)`,
              // 用角度差做前后层次的光影
              filter: "none",
            }}
          >
            {it.image ? (
              <img src={it.image} alt={it.title} loading="lazy" />
            ) : (
              <div className="dc-ph" style={{ background: it.accent ?? "linear-gradient(135deg,#3b82f6,#a855f7)" }}>
                <span className="dc-emoji">{it.emoji ?? "📷"}</span>
              </div>
            )}
            <figcaption>
              <b>{it.title}</b>
              {it.caption && <span>{it.caption}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="dc-controls">
        <button type="button" className="dc-btn" onClick={() => go(-1)} aria-label="上一张">
          <ChevronLeft size={18} />
        </button>
        <span className="dc-hint">{hovered ? "拖动步进 · 移开恢复旋转" : "鼠标悬停可暂停"}</span>
        <button type="button" className="dc-btn" onClick={() => go(1)} aria-label="下一张">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
