import Link from "next/link";
import { getAllNotes, getAllAnnouncements, getAllAwards, getAllLabs, getAllVisualizations } from "@/lib/content/loader";

export default function AdminDashboardPage() {
  const notes = getAllNotes().length;
  const anns = getAllAnnouncements().length;
  const awards = getAllAwards().length;
  const vizs = getAllVisualizations().length;
  const labs = getAllLabs().length;

  const stats = [
    { label: "算法笔记", value: notes, href: "/admin/notes" },
    { label: "公告", value: anns, href: "/admin/announcements" },
    { label: "荣誉墙证书", value: awards, href: "/admin/awards" },
    { label: "简易演示", value: vizs, href: "/admin/visualization" },
    { label: "实验台", value: labs, href: "/admin/visualization" },
  ];

  return (
    <div>
      <h2>内容概览</h2>
      <p className="muted">本站内容以文件形式存放于 content/，后台上传会自动校验并 git 提交。</p>
      <div className="grid grid-3" style={{ marginTop: 20 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: "var(--accent)" }}>{s.value}</div>
            <div className="muted">{s.label}</div>
          </Link>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 20, fontSize: 13 }}>
        新增内容步骤：填写表单 → 后台上传（自动按 Schema 校验）→ 写入 content/ → 自动 git 提交。
      </p>
    </div>
  );
}
