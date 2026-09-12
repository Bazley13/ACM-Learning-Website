"use client";

/**
 * NavShell —— 全站统一悬浮卡片导航（CardNav 忠实移植）。
 *  - 所有页面使用同一 CardNav（含左上角 ICPc 标识），上滑自动收起。
 *  - 首页：直接悬浮于幻灯片首屏背景之上；其他页面加顶部留白，避免盖住正文。
 */
import { usePathname } from "next/navigation";
import CardNav, { type CardNavItem } from "@/components/CardNav";
import IcpcLogo from "@/components/IcpcLogo";

const ITEMS: CardNavItem[] = [
  {
    label: "内容",
    bgColor: "#13244f",
    textColor: "#eef4ff",
    links: [
      { label: "算法笔记", href: "/notes" },
      { label: "算法可视化", href: "/visualization" },
    ],
  },
  {
    label: "了解工作室",
    bgColor: "#3a1f5e",
    textColor: "#f3ecff",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "资源推荐", href: "/resources" },
      { label: "公告", href: "/announcements" },
    ],
  },
  {
    label: "成果",
    bgColor: "#451c2a",
    textColor: "#ffeef2",
    links: [{ label: "荣誉墙", href: "/awards" }],
  },
];

export default function NavShell() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <header className="nav-shell">
      <CardNav logo={<IcpcLogo size={26} />} logoAlt="ICPC 标识" items={ITEMS} ctaLabel="算法可视化" ctaHref="/visualization" />
      {!onHome && <div className="nav-shell-spacer" aria-hidden />}
    </header>
  );
}
