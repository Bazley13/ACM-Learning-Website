"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminVisualizationPage() {
  const [vizJson, setVizJson] = useState("");
  const [labFile, setLabFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

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
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + (data.errors ?? ["未知错误"]).join("；") });
    }
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
    const res = await fetch("/admin/api/visualization/lab", {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: `已上传实验台：${data.id} （${data.detail ? data.detail + "；" : ""}访问 ${data.labUrl}）` });
      setLabFile(null);
      router.refresh();
    } else {
      setMsg({ text: (data.errors ?? ["未知错误"]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>可视化 / 实验台上传</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      {/* 简易档 */}
      <form onSubmit={onVizSubmit} className="card" style={{ marginBottom: 24 }}>
        <h3>简易演示（JSON 步骤帧）</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          粘贴一个符合 visualization.schema.json 的 JSON（参照 content/visualization-format/examples/bubble-sort.json）。
        </p>
        <div className="field">
          <textarea
            style={{ minHeight: 240, fontFamily: "monospace" }}
            value={vizJson}
            onChange={(e) => setVizJson(e.target.value)}
            placeholder='{ "id": "example", "schemaVersion": "1.0", ... }'
          />
        </div>
        <button className="btn" type="submit">上传简易演示</button>
      </form>

      {/* 实验台 ZIP */}
      <form onSubmit={onLabSubmit} className="card">
        <h3>实验台小程序（ZIP）</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          上传一个 ZIP：顶层需含 manifest.json + 入口 HTML + 资源。上传后自动解压校验并静态托管（沙箱运行）。参照 content/visualization-format/README.md。
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
