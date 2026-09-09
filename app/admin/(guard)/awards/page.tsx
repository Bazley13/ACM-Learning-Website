"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMPETITIONS = ["ICPC", "CCPC", "码蹄杯", "蓝桥杯", "百度之星", "PTA团体程序设计大赛", "辽宁省程序设计大赛", "其他"];

export default function AdminAwardsPage() {
  const [form, setForm] = useState({
    id: "",
    competition: "ICPC",
    level: "国家级",
    title: "",
    awardDate: "",
    season: "",
    members: "",
    note: "",
  });
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

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
      setMsg({ ok: true, text: "已保存并尝试自动提交 git。" });
      setImageDataUrl(null);
      setImageFilename("");
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + (data.errors ?? ["未知错误"]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>新增荣誉墙证书</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>id（URL 标识，英文小写 + 连字符）</label>
          <input required value={form.id} onChange={(e) => set("id", e.target.value)} placeholder="2024-icpc-bronze" />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>比赛</label>
            <select value={form.competition} onChange={(e) => set("competition", e.target.value)}>
              {COMPETITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>级别</label>
            <select value={form.level} onChange={(e) => set("level", e.target.value)}>
              <option value="ICPC亚洲区域赛">ICPC亚洲区域赛</option>
              <option value="CCPC中国大学生程序设计竞赛">CCPC中国大学生程序设计竞赛</option>
              <option value="国家级">国家级</option>
              <option value="省级">省级</option>
              <option value="市级">市级</option>
              <option value="校内">校内</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>奖项名称</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="金奖 / 银奖 / 一等奖" />
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
            <input value={form.members} onChange={(e) => set("members", e.target.value)} placeholder="张三, 李四, 王五" />
          </div>
        </div>
        <div className="field">
          <label>备注/战报（可选）</label>
          <textarea value={form.note} onChange={(e) => set("note", e.target.value)} />
        </div>
        <div className="field">
          <label>证书图片（jpg/png，小于 5MB）</label>
          <input type="file" accept="image/*" onChange={onImage} />
          {imageDataUrl && (
            <img src={imageDataUrl} alt="预览" style={{ marginTop: 8, maxHeight: 160, borderRadius: 8 }} />
          )}
        </div>
        <button className="btn" type="submit">保存荣誉</button>
      </form>
    </div>
  );
}
