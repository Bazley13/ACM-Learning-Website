"use client";

// 后台：首页第三屏「比赛·日常」照片轮播编辑。
// 每条一张卡片：标题 / 说明 / emoji / 渐变色（预设下拉或手动输入）/ 图片（上传或用已有路径）。
// 图片留空时轮播卡片显示 emoji + 渐变占位。
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

interface PhotoRow { id: string; title: string; caption: string; emoji: string; accent: string; image: string; }

const ACCENT_SETS = [
  { label: "蓝", pair: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { label: "紫罗兰", pair: "linear-gradient(135deg,#6d5ef0,#a855f7)" },
  { label: "红橙", pair: "linear-gradient(135deg,#ef4444,#f97316)" },
  { label: "绿", pair: "linear-gradient(135deg,#22c55e,#16a34a)" },
  { label: "金黄", pair: "linear-gradient(135deg,#eab308,#f97316)" },
  { label: "天蓝", pair: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
];

export default function AdminPhotosPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/admin/api/photos")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.photos ?? []).map((p: PhotoRow) => ({
          id: p.id ?? "",
          title: p.title ?? "",
          caption: p.caption ?? "",
          emoji: p.emoji ?? "🏆",
          accent: p.accent ?? ACCENT_SETS[0].pair,
          image: p.image ?? "",
        }));
        setRows(list.length ? list : []);
      })
      .catch(() => setMsg({ text: "读取失败" }))
      .finally(() => setLoaded(true));
  }, []);

  const set = (i: number, patch: Partial<PhotoRow>) =>
    setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  function addRow() {
    setRows((rs) => [
      ...rs,
      { id: "photo-" + Date.now().toString(36), title: "新照片", caption: "", emoji: "📷", accent: ACCENT_SETS[0].pair, image: "" },
    ]);
  }
  function delRow(i: number) {
    setRows((rs) => rs.filter((_, k) => k !== i));
  }

  async function onUpload(i: number, file: File) {
    if (!file.type.startsWith("image/")) { alert("请选择图片"); return; }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !(d as { url?: string }).url) { alert((d as { error?: string }).error ?? "上传失败"); return; }
      set(i, { image: (d as { url: string }).url });
    } catch { alert("上传失败"); }
  }

  async function onSave() {
    setMsg(null);
    const photos = rows
      .filter((r) => r.id.trim() && r.title.trim())
      .map((r) => ({
        id: r.id.trim(),
        title: r.title.trim(),
        caption: r.caption.trim() || undefined,
        emoji: r.emoji.trim() || undefined,
        accent: r.accent.trim() || undefined,
        image: r.image.trim() || undefined,
      }));
    const res = await fetch("/admin/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已保存并尝试提交 git。" : "保存失败：" + ((d.errors ?? ["未知错误"]) as string[]).join("；") });
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ maxWidth: 920 }}>
      <h2>比赛 · 日常 照片轮播</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        首页第三屏右侧轮播照片。每条一张卡片：上传图片（落盘到 <code>/uploads/</code>），或直接填已有路径；
        图片留空时卡片显示 emoji + 渐变色。可增删、拖动顺序暂不支持（按卡片顺序展示）。
      </p>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      {loaded && rows.map((r, i) => (
        <div key={r.id || i} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <input value={r.emoji} title="emoji" style={{ width: 60 }} onChange={(e) => set(i, { emoji: e.target.value })} />
            <input value={r.title} placeholder="标题" style={{ width: 220 }} onChange={(e) => set(i, { title: e.target.value })} />
            <span className="muted" style={{ fontSize: 12 }}>id</span>
            <input value={r.id} style={{ width: 170 }} onChange={(e) => set(i, { id: e.target.value })} />
            <button className="btn-ghost danger" type="button" style={{ marginLeft: "auto" }} onClick={() => delRow(i)}>删除</button>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <input value={r.caption} placeholder="说明文字（选填）" onChange={(e) => set(i, { caption: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select value={r.accent} onChange={(e) => set(i, { accent: e.target.value })}>
              {ACCENT_SETS.map((a) => <option key={a.pair} value={a.pair}>{a.label} 渐变</option>)}
              <option value={r.accent && !ACCENT_SETS.some((a) => a.pair === r.accent) ? r.accent : "custom"}>自定义</option>
            </select>
            <input value={r.accent} title="渐变值" style={{ width: 260 }} onChange={(e) => set(i, { accent: e.target.value })} />
            <input ref={(el) => { fileRefs.current[r.id] = el; }} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(i, f); e.target.value = ""; }} />
            <button className="btn ghost" type="button" onClick={() => fileRefs.current[r.id]?.click()}>
              <Upload size={14} /> 上传图片
            </button>
            {r.image && <a className="btn-ghost" href={r.image} target="_blank" rel="noopener">{r.image}</a>}
            <input value={r.image} placeholder="图片路径 /uploads/…（留空＝emoji+渐变占位）" style={{ width: 260 }} onChange={(e) => set(i, { image: e.target.value })} />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" type="button" onClick={onSave}>保存照片</button>
        <button className="btn ghost" type="button" onClick={addRow}>+ 添加照片</button>
      </div>
    </div>
  );
}
