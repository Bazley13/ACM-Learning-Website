"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV } from "@/lib/site-nav";
import IcpcLogo from "@/components/IcpcLogo";

/**
 * SiteNav —— 下拉导航（桌面 hover/focus 展开；移动端汉堡折叠）
 * 结构配置见 lib/site-nav.ts。
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // 移动端菜单展开
  const [openGroup, setOpenGroup] = useState<string | null>(null); // 移动端下拉分组

  const isActive = (href?: string) =>
    href && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const headerRef = useRef<HTMLHeadElement | null>(null);

  // 上滑显示、下滑收起（滚动方向判定）
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      lastY = y;
      el.style.transform = down ? "translateY(-100%)" : "translateY(0)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="topnav">
      <div className="container topnav-inner">
        <Link href="/" className="brand">
          <IcpcLogo size={22} />
          DLNU<span>·ACM</span>
        </Link>

        {/* 桌面导航 */}
        <nav className="site-nav" aria-label="主导航">
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="nav-item">
                <button
                  className="nav-btn"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={false}
                >
                  {item.label}
                  <ChevronDown size={14} aria-hidden />
                </button>
                <div className="nav-drop" role="menu">
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={isActive(c.href) ? "active" : ""}
                      role="menuitem"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className={isActive(item.href) ? "active" : ""}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* 移动端汉堡 */}
        <button
          className="hamburger"
          type="button"
          aria-label="切换菜单"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* 移动端折叠面板 */}
      {open && (
        <nav className="mobile-nav" aria-label="移动端导航">
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="m-group">
                <button
                  type="button"
                  className="m-item"
                  onClick={() =>
                    setOpenGroup((g) => (g === item.label ? null : item.label))
                  }
                  aria-expanded={openGroup === item.label}
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    style={{
                      transform:
                        openGroup === item.label
                          ? "rotate(180deg)"
                          : undefined,
                      transition: "transform .2s",
                    }}
                  />
                </button>
                {openGroup === item.label && (
                  <div className="m-children">
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setOpen(false)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="m-item"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
