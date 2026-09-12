"use client";

/**
 * Slide3D —— 三屏切换的“立体卡片翻页”效果。
 * 用 IntersectionObserver 监听 .home-slides 内每张 .slide，
 * 命中的那张加 .slide--active（回到正面 + 不透明），其余保持轻微旋转/压暗，
 * 配合 CSS perspective + rotateX 形成立体卡片翻面的观感。
 */
import { useEffect } from "react";

export default function Slide3D() {
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".home-slides");
    if (!scroller) return;
    const slides = Array.from(scroller.querySelectorAll<HTMLElement>(".slide"));
    if (!slides.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const el = en.target as HTMLElement;
          el.classList.toggle("slide--active", en.isIntersecting && en.intersectionRatio >= 0.45);
        }
      },
      { root: scroller, threshold: [0, 0.3, 0.5, 0.7, 1] }
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return null;
}
