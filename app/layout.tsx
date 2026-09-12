import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "DLNU ACM工作室",
  description: "大连民族大学 ACM 工作室：算法笔记、可视化实验台、荣誉墙。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteNav />
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
          DLNU ACM工作室 · 传承与沉淀，服务历届算法竞赛爱好者
        </footer>
      </body>
    </html>
  );
}
