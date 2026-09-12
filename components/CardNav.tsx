"use client";

/**
 * CardNav —— 悬浮卡片导航（忠实移植 ReactBits / reactbits.dev 的 CardNav，gsap）。
 * 汉堡按钮展开为若干卡片组，鼠标/键盘可交互。此处用于首页首屏，悬浮于背景之上。
 * ⚠ 第三方开源组件，发布前请在交接文档确认许可条款（gsap 免费版许可）。
 */
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { gsap } from "gsap";
import { ArrowUpRight, Menu, X } from "lucide-react";

export interface CardNavLink {
  label: string;
  href: string;
  ariaLabel?: string;
}
export interface CardNavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
}

export interface CardNavProps {
  logo: ReactNode;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  baseColor?: string;
  menuColor?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ease?: string;
}

const CardNav = ({
  logo,
  logoAlt = "Logo",
  items,
  className = "",
  baseColor = "#0f1730",
  menuColor = "#fff",
  ctaLabel = "在线练习",
  ctaHref = "/visualization",
  ease = "power3.out",
}: CardNavProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const linksTotal = items.reduce((n, it) => n + (it.links?.length ?? 0), 0);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[i] = el;
  };

  const buildTimeline = () => {
    const nav = navRef.current;
    if (!nav) return null;
    gsap.set(nav, { height: 64, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(nav, { height: "auto", duration: 0.45, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.07 }, "-=0.12");
    return tl;
  };

  useLayoutEffect(() => {
    const tl = buildTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 上滑收起、下滑隐藏导航（悬浮于首屏背景之上，滚轮进入下一屏时自动收起）
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // 首页是嵌套的幻灯片滚动容器（.home-slides），窗口本身不滚动；否则用窗口滚动。
    const scroller = root.closest(".home-slides") ?? window;
    const readY = () =>
      scroller === window ? window.scrollY || window.pageYOffset || 0 : (scroller as HTMLElement).scrollTop || 0;
    let lastY = readY();
    let hidden = false;
    const onScroll = () => {
      const y = readY();
      const goingDown = y > lastY + 6;
      const goingUp = y < lastY - 6;
      lastY = y;
      if (goingDown && !hidden) {
        hidden = true;
        gsap.to(root, { y: -Math.min(140, root.offsetHeight + 24), duration: 0.35, ease: "power2.in" });
        setOpen(false);
      } else if (goingUp && hidden) {
        hidden = false;
        gsap.to(root, { y: 0, duration: 0.4, ease: "power3.out" });
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const toggle = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!open) {
      setOpen(true);
      tl.timeScale(1).play(0);
    } else {
      tl.timeScale(1.6).reverse();
      tl.eventCallback("onReverseComplete", () => setOpen(false));
    }
  };

  return (
    <div ref={rootRef} className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${open ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
        aria-label="主导航"
      >
        <div className="card-nav-top">
          <button
            type="button"
            className={`card-nav-hamburger ${open ? "open" : ""}`}
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "收起菜单" : "展开菜单"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="card-nav-logo">{logo}</div>
          <a className="card-nav-cta" href={ctaHref}>
            {ctaLabel} <ArrowUpRight size={15} />
          </a>
        </div>

        <div className={`card-nav-content${open ? " open" : ""}`}>
          {open &&
            items.slice(0, 4).map((item, idx) => (
              <div
                key={item.label}
                className="nav-card"
                ref={setCardRef(idx)}
                style={{ backgroundColor: item.bgColor, color: item.textColor }}
              >
                <div className="nav-card-label">{item.label}</div>
                <div className="nav-card-links">
                  {item.links?.map((lnk) => (
                    <a key={lnk.href} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel ?? lnk.label}>
                      <ArrowUpRight className="nav-card-link-icon" aria-hidden />
                      {lnk.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </nav>
      <span className="card-nav-note">{linksTotal} 个入口</span>
    </div>
  );
};

export default CardNav;
