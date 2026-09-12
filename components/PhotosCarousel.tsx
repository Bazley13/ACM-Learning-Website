"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Photo {
  id: string;
  title: string;
  caption?: string;
  image?: string;
  emoji?: string;
  accent?: string;
}

/**
 * PhotosCarousel —— 首页第三屏右侧照片轮播（自制，纯 CSS/React）。
 * 自动每 4s 切换，可左右步进、点选圆点；未配照片时用渐变 + emoji 占位。
 */
export default function PhotosCarousel({ items }: { items: Photo[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="photos-carousel">
      <div className="photos-viewport">
        <div className="photos-stage" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {items.map((it) => (
            <figure key={it.id} className="photos-slide">
              {it.image ? (
                <img src={it.image} alt={it.title} loading="lazy" />
              ) : (
                <div
                  className="photos-ph"
                  style={{ background: it.accent ?? "linear-gradient(135deg,#3b82f6,#a855f7)" }}
                >
                  <span className="photos-emoji">{it.emoji ?? "📷"}</span>
                </div>
              )}
              <figcaption>
                <b>{it.title}</b>
                {it.caption && <span>{it.caption}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="photos-controls">
        <button type="button" className="photos-btn" onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)} aria-label="上一张">
          <ChevronLeft size={16} />
        </button>
        <div className="photos-dots">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              className={"photos-dot" + (i === idx ? " active" : "")}
              onClick={() => setIdx(i)}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
        <button type="button" className="photos-btn" onClick={() => setIdx((i) => (i + 1) % items.length)} aria-label="下一张">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
