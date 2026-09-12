"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VizItem { id: string; title?: string; [k: string]: unknown; }
interface LabItem { id: string; manifest?: { title?: string }; }

export default function AdminVisualizationPage() {
  const router = useRouter();
  const [vizList, setVizList] = useState<VizItem[]>([]);
  const [labList, setLabList] = useState<LabItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [vizJson, setVizJson] = useState("");
  const [editingViz, setEditingViz] = useState<string | null>(null);
  const [labFile, setLabFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function refresh() {
    fetch("/admin/api/visualization")
      .then((r) => r.json())
      .then((d) => setVizList(d.items ?? []))
      .catch(() => {});
    fetch("/admin/api/visualization/lab")
      .then((r) => r.json())
      .then((d) => setLabList(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }
  useEffect(refresh, []);

  async function onVizSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    let visualization: object;
    try {
      visualization = JSON.parse(vizJson);
    } catch {
      setMsg({ text: "JSON 解析失败" });
      return;
    }
    const res = await fetch("/admin/api/visualization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visualization }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已上传简易演示。" });
      setVizJson("");
      setEditingViz(null);
      refresh();
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + ((data.errors ?? ["未知错误"]) as string[]).join("；") });
    }
  }

  function startEditViz(v: VizItem) {
    setEditingViz(v.id);
    setVizJson(JSON.stringify(v, null, 2));
    document.querySelector(".viz-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onVizDelete(v: VizItem) {
    if (!confirm(`确定删除可视化「${v.title ?? v.id}」？会写入 git 历史。`)) return;
    const res = await fetch(`/admin/api/visualization?id=${encodeURIComponent(v.id)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已删除并尝试提交 git。" : ((d.errors ?? ["删除失败"]) as string[]).join("；") });
    refresh();
  }

  async function onLabDelete(l: LabItem) {
    if (!confirm(`确定删除实验台「${l.manifest?.title ?? l.id}」？会写入 git 历史。`)) return;
    const res = await fetch(`/admin/api/visualization/lab?id=${encodeURIComponent(l.id)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已删除并尝试提交 git。" : ((d.errors ?? ["删除失败"]) as string[]).join("；") });
    refresh();
  }

  async function onLabSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!labFile) {
      setMsg({ text: "请选择 ZIP 文件" });
      return;
    }
    const fd = new FormData();
    fd.append("file", labFile);
    const res = await fetch("/admin/api/visualization/lab", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: `已上传实验台：${data.id}（访问 ${data.labUrl}）` });
      setLabFile(null);
      refresh();
      router.refresh();
    } else {
      setMsg({ text: ((data.errors ?? ["未知错误"]) as string[]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h2>可视化 / 实验台管理</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      {/* 已上传列表 */}
      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>已上传的简易可视化（{vizList.length}）</h3>
        {loaded && vizList.length === 0 && <div className="muted">暂无简易可视化</div>}
        {vizList.map((v) => (
          <div key={v.id} className="ann-row" style={{ borderBottom: "1px solid var(--border)", padding: "10px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600 }}>{v.title ?? v.id}</span>
            <span className="muted" style={{ fontSize: 12 }}>{v.id}</span>
            <span className="ann-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn-ghost" type="button" onClick={() => startEditViz(v)}>编辑</button>
              <button className="btn-ghost danger" type="button" onClick={() => onVizDelete(v)}>删除</button>
            </span>
          </div>
        ))}
        <h3 style={{ fontSize: 15, margin: "16px 0 10px" }}>已上传的实验台（{labList.length}）</h3>
        {loaded && labList.length === 0 && <div className="muted">暂无实验台</div>}
        {labList.map((l) => (
          <div key={l.id} className="ann-row" style={{ borderBottom: "1px solid var(--border)", padding: "10px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600 }}>{l.manifest?.title ?? l.id}</span>
            <span className="muted" style={{ fontSize: 12 }}>{l.id}</span>
            <span className="ann-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <a className="btn-ghost" href={`/lab/${l.id}`} target="_blank" rel="noopener">查看</a>
              <button className="btn-ghost danger" type="button" onClick={() => onLabDelete(l)}>删除</button>
            </span>
          </div>
        ))}
      </section>

      {/* 简易档 */}
      <form onSubmit={onVizSubmit} className="card viz-form" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>{editingViz ? `编辑可视化 ${editingViz}（重新提交覆盖，id 不改）` : "上传简易演示（JSON 步骤帧）"}</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          粘贴符合 visualization.schema.json 的 JSON（参照 content/visualization-format/examples/bubble-sort.json）。
        </p>
        <div className="field">
          <textarea style={{ minHeight: 240, fontFamily: "monospace" }} value={vizJson} onChange={(e) => setVizJson(e.target.value)} />
        </div>
        <button className="btn" type="submit">{editingViz ? "保存修改" : "上传简易演示"}</button>
      </form>

      {/* 实验台 ZIP */}
      <form onSubmit={onLabSubmit} className="card">
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>上传实验台（ZIP 覆盖同名 id）</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          上传一个 ZIP：顶层含 manifest.json + 入口 HTML + 资源，自动解压校验并托管。上传同名 id 即覆盖更新。
        </p>
        <div className="field">
          <label>选择 ZIP（≤ 20MB）</label>
          <input type="file" accept=".zip" onChange={(e) => setLabFile(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn" type="submit">上传实验台</button>
      </form>
    </div>
  );
}
