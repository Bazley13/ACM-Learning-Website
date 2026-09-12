"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { awardImagePublicPath } from "@/lib/content/urls";

const COMPETITIONS = ["ICPC", "CCPC", "码蹄杯", "蓝桥杯", "百度之星", "PTA团体程序设计大赛", "辽宁省程序设计大赛", "其他"];
const LEVELS = ["ICPC亚洲区域赛", "CCPC中国大学生程序设计竞赛", "国家级", "省级", "市级", "校内", "其他"];

interface Award {
  id: string;
  competition?: string;
  level?: string;
  title: string;
  awardDate?: string;
  season?: string;
  members?: string[];
  note?: string;
  image?: string;
}

const EMPTY = {
  id: "",
  competition: "ICPC",
  level: "国家级",
  title: "",
  awardDate: "",
  season: "",
  members: "",
  note: "",
};

export default function AdminAwardsPage() {
  const router = useRouter();
  const [list, setList] = useState<Award[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function refresh() {
    fetch("/admin/api/awards")
      .then((r) => r.json())
      .then((d) => setList(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }

  useEffect(refresh, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ text: "图片请小于 5MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageFilename(file.name);
    };
    reader.readAsDataURL(file);
  }

  function startEdit(a: Award) {
    setViewing(null);
    setEditing(true);
    setImageDataUrl(null);
    setForm({
      id: a.id,
      competition: a.competition ?? "ICPC",
      level: a.level ?? "国家级",
      title: a.title ?? "",
      awardDate: a.awardDate ?? "",
      season: a.season ?? "",
      members: (a.members ?? []).join(", "),
      note: a.note ?? "",
    });
    document.querySelector(".award-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onDelete(a: Award) {
    if (!confirm(`确定删除荣誉「${a.title}」？会写入 git 历史不可撤回。`)) return;
    const res = await fetch(`/admin/api/awards?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已删除并尝试提交 git。" : ((d.errors ?? ["删除失败"]) as string[]).join("；") });
    refresh();
    if (editing && form.id === a.id) {
      setEditing(false);
      setForm(EMPTY);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const award = {
      id: form.id,
      competition: form.competition,
      level: form.level,
      title: form.title,
      awardDate: form.awardDate,
      season: form.season || undefined,
      members: form.members.split(/[,，]/).map((s) => s.trim()).filter(Boolean) || undefined,
      note: form.note || undefined,
    };
    const res = await fetch("/admin/api/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        award,
        image: imageDataUrl ? { dataUrl: imageDataUrl, filename: imageFilename } : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存" + (editing ? "（覆盖）" : "并提交") + "，尝试自动提交 git。" });
      setImageDataUrl(null);
      setImageFilename("");
      setEditing(false);
      refresh();
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + ((data.errors ?? ["未知错误"]) as string[]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h2>荣誉墙管理</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>已提交的荣誉（{list.length}）</h3>
        {loaded && list.length === 0 && <div className="muted">暂无已提交荣誉</div>}
        {list.map((a) => {
          const open = viewing === a.id;
          return (
            <div key={a.id} className="ann-row" style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
              <div className="ann-row-head" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="ann-title" style={{ fontWeight: 600 }}>
                  {a.title}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {a.competition ?? ""}{a.level ? " · " + a.level : ""}{a.awardDate ? " · " + a.awardDate : ""}
                </span>
                <span className="ann-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="btn-ghost" type="button" onClick={() => setViewing(open ? null : a.id)}>
                    {open ? "收起" : "查看"}
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => startEdit(a)}>编辑</button>
                  <button className="btn-ghost danger" type="button" onClick={() => onDelete(a)}>删除</button>
                </span>
              </div>
              {open && (
                <div style={{ marginTop: 10, padding: 12, background: "var(--bg-soft)", borderRadius: 8 }}>
                  {a.members && a.members.length > 0 && (
                    <p className="muted" style={{ margin: "0 0 6px" }}>成员：{a.members.join("、")}</p>
                  )}
                  {a.note && <p style={{ margin: "0 0 6px" }}>{a.note}</p>}
                  {a.image ? (
                    <img src={awardImagePublicPath(a.image)} alt={a.title} style={{ maxHeight: 220, borderRadius: 8, display: "block" }} />
                  ) : (
                    <div className="muted">无证书图片</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <form onSubmit={onSubmit} className="card award-form">
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>{editing ? "编辑荣誉（id 保留，覆盖原文件）" : "新增荣誉墙证书"}</h3>
        <div className="field">
          <label>id（URL 标识，英文小写 + 连字符）</label>
          <input required disabled={editing} value={form.id} onChange={(e) => set("id", e.target.value)}
            placeholder="2024-icpc-bronze" style={{ background: editing ? "var(--bg-soft)" : undefined }} />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>比赛</label>
            <select value={form.competition} onChange={(e) => set("competition", e.target.value)}>
              {COMPETITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>级别</label>
            <select value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>奖项名称</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="field">
            <label>获奖日期</label>
            <input type="date" required value={form.awardDate} onChange={(e) => set("awardDate", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>赛季（可选）</label>
            <input value={form.season} onChange={(e) => set("season", e.target.value)} placeholder="2024-2025" />
          </div>
          <div className="field">
            <label>成员（逗号分隔，可选）</label>
            <input value={form.members} onChange={(e) => set("members", e.target.value)} placeholder="张三, 李四" />
          </div>
        </div>
        <div className="field">
          <label>备注/战报（可选）</label>
          <textarea value={form.note} onChange={(e) => set("note", e.target.value)} />
        </div>
        <div className="field">
          <label>证书图片（jpg/png，小于 5MB{editing ? "；若不上传则保留原图" : ""}）</label>
          <input type="file" accept="image/*" onChange={onImage} />
          {imageDataUrl && <img src={imageDataUrl} alt="预览" style={{ marginTop: 8, maxHeight: 160, borderRadius: 8 }} />}
        </div>
        <button className="btn" type="submit">{editing ? "保存修改" : "提交荣誉"}</button>
      </form>
    </div>
  );
}
