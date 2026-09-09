import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DLNU ACM工作室",
  description: "大连民族大学 ACM 工作室：算法笔记、可视化实验台、荣誉墙。",
};

const NAV = [
  { href: "/", label: "首页" },
  { href: "/notes", label: "算法笔记" },
  { href: "/visualization", label: "可视化与实验台" },
  { href: "/awards", label: "荣誉墙" },
  { href: "/announcements", label: "公告" },
  { href: "/about", label: "关于我们" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="topnav">
          <div className="container">
            <Link href="/" className="brand">
              DLNU<span>·ACM</span>
            </Link>
            <nav>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-dim)",
            fontSize: 13,
            padding: "24px 0 40px",
            textAlign: "center",
          }}
        >
          DLNU ACM工作室 · 这个网站会一届一届传下去
        </footer>
      </body>
    </html>
  );
}
