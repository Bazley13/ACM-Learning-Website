import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { validateSessionToken, SESSION_COOKIE } from "@/lib/auth";

// 路由组 (guard)：只有放在这里的受保护页面会经过本守卫。
// /admin/login 单独在路由组外，因此未登录用户也能访问，不受本布局重定向影响。
export default function AdminGuardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const authed = token ? validateSessionToken(token) : false;
  if (!authed) redirect("/admin/login");
  return (
    <div>
      <h1>管理后台</h1>
      <nav style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/admin">概览</Link>
        <Link href="/admin/notes">笔记</Link>
        <Link href="/admin/announcements">公告</Link>
        <Link href="/admin/awards">荣誉墙</Link>
        <Link href="/admin/intro">简介</Link>
        <Link href="/admin/visualization">可视化/实验台</Link>
        <Link href="/admin/logout">退出</Link>
      </nav>
      {children}
    </div>
  );
}
