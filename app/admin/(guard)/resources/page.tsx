"use client";

// 后台：资源推荐 —— 友好表单式编辑（分类 → 条目），不再要求手写 JSON。
// 洛谷/牛客已预置，图标用下拉选择（内置 SVG/品牌图标 key）。
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ICONS = [
  "codeforces", "leetcode", "codechef", "bilibili", "youtube", "hackerrank", "wikipedia",
  "luogu", "nowcoder", "globe", "code", "book", "lightbulb", "tools", "graduation", "flask",
];
const COLORS = ["ac", "highlight", "tle", "primary", "wa"];

interface CatItem { name: string; url: string; icon: string; desc: string; }
interface Cat { id: string; name: string; color: string; description: string; items: CatItem[]; }

export default function AdminResourcesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function load() {
    fetch("/admin/api/resources")
      .then((r) => r.json())
      .then((d) => {
        const c = (d.resources?.categories ?? []).map((x: Cat) => ({
          id: x.id ?? "",
          name: x.name ?? "",
          color: COLORS.includes(x.color as string) ? (x.color as string) : "ac",
          description: x.description ?? "",
          items: (x.items ?? []).map((i) => ({
            name: i.name ?? "",
            url: i.url ?? "",
            icon: ICONS.includes(i.icon as string) ? (i.icon as string) : "globe",
            desc: i.desc ?? "",
          })),
        }));
        setCats(c.length ? c : [{ id: "oj", name: "算法竞赛网站", color: "ac", description: "", items: [] }]);
      })
      .catch(() => setMsg({ text: "读取失败" }))
      .finally(() => setLoaded(true));
  }
  useEffect(() => { load(); }, []);

  const setCat = (i: number, patch: Partial<Cat>) =>
    setCats((cs) => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const setItem = (i: number, j: number, patch: Partial<CatItem>) =>
    setCats((cs) => cs.map((c, k) =>
      k === i ? { ...c, items: c.items.map((it, l) => (l === j ? { ...it, ...patch } : it)) } : c));

  function addItem(i: number) {
    setCats((cs) => cs.map((c, k) =>
      k === i ? { ...c, items: [...c.items, { name: "", url: "https://", icon: "globe", desc: "" }] } : c));
  }
  function delItem(i: number, j: number) {
    setCats((cs) => cs.map((c, k) => (k === i ? { ...c, items: c.items.filter((_, l) => l !== j) } : c)));
  }
  function addCat() {
    setCats((cs) => [...cs, { id: "new-" + Date.now(), name: "新分类", color: "ac", description: "", items: [] }]);
  }
  function delCat(i: number) {
    setCats((cs) => cs.filter((_, k) => k !== i));
  }

  async function onSave() {
    setMsg(null);
    const clean = cats.map((c) => ({
      id: c.id.trim(),
      name: c.name.trim(),
      color: c.color,
      description: c.description.trim(),
      items: c.items
        .filter((it) => it.name.trim())
        .map((it) => ({ name: it.name.trim(), url: it.url.trim(), icon: it.icon, desc: it.desc.trim() })),
    })).filter((c) => c.name);
    const res = await fetch("/admin/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resources: { categories: clean } }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已保存并尝试提交 git。" : "保存失败：" + ((d.errors ?? ["未知错误"]) as string[]).join("；") });
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ maxWidth: 920 }}>
      <h2>资源推荐管理</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        每个分类一张卡片，逐条填 名称 / 链接 / 图标 / 简介。图标下拉内置了洛谷、牛客等品牌图标。可增删分类与条目。
      </p>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      {loaded && cats.map((c, i) => (
        <div key={c.id || i} className="card res-cat" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <strong>分类 {i + 1}：</strong>
            <input value={c.name} placeholder="分类名" style={{ width: 160 }}
              onChange={(e) => setCat(i, { name: e.target.value })} />
            <input value={c.id} placeholder="id" style={{ width: 120 }}
              onChange={(e) => setCat(i, { id: e.target.value })} />
            <label className="muted" style={{ fontSize: 12 }}>色标
              <select value={c.color} onChange={(e) => setCat(i, { color: e.target.value })}>
                {COLORS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <button className="btn-ghost danger" type="button" onClick={() => delCat(i)}>删除分类</button>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <input value={c.description} placeholder="分类简介（可选）"
              onChange={(e) => setCat(i, { description: e.target.value })} />
          </div>
          {c.items.map((it, j) => (
            <div key={j} className="res-item" style={{ display: "grid", gap: 8, gridTemplateColumns: "150px 1fr 120px 1fr 30px", marginBottom: 8, alignItems: "center" }}>
              <input value={it.name} placeholder="名称" onChange={(e) => setItem(i, j, { name: e.target.value })} />
              <input value={it.url} placeholder="https://…" onChange={(e) => setItem(i, j, { url: e.target.value })} />
              <select value={it.icon} onChange={(e) => setItem(i, j, { icon: e.target.value })}>
                {ICONS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <input value={it.desc} placeholder="简介" onChange={(e) => setItem(i, j, { desc: e.target.value })} />
              <button className="btn-ghost danger" type="button" title="删除条目" onClick={() => delItem(i, j)}>×</button>
            </div>
          ))}
          <button className="btn ghost" type="button" style={{ marginRight: 8 }} onClick={() => addItem(i)}>+ 添加条目</button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn" type="button" onClick={onSave}>保存资源推荐</button>
        <button className="btn ghost" type="button" onClick={addCat}>+ 添加分类</button>
      </div>
    </div>
  );
}
