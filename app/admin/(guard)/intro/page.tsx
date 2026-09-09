"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminIntroPage() {
  const [form, setForm] = useState({
    slogan: "",
    focus: "",
    description: "",
  });
  const [historyText, setHistoryText] = useState("");
  const [contestsText, setContestsText] = useState("");
  const [contact, setContact] = useState({ qqGroup: "", email: "", recruitNotice: "" });
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/admin/api/intro/get")
      .then((r) => r.json())
      .then((intro) => {
        setForm({
          slogan: intro.slogan ?? "",
          focus: intro.focus ?? "",
          description: intro.description ?? "",
        });
        setHistoryText(
          (intro.history ?? []).map((h: { season: string; summary: string }) => `${h.season}| ${h.summary}`).join("\n")
        );
        setContestsText((intro.contests ?? []).map((c: { name: string }) => c.name).join("、"));
        setContact(intro.contact ?? {});
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const intro = {
      name: "ACM工作室",
      slogan: form.slogan,
      focus: form.focus,
      description: form.description,
      history: historyText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [season, ...rest] = line.split("|");
          return { season: season.trim(), summary: rest.join("|").trim() };
        }),
      contests: contestsText
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, type: name })),
      contact,
    };
    const res = await fetch("/admin/api/intro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intro }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存并尝试自动提交 git。" });
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + (data.errors ?? ["未知错误"]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>编辑工作室简介</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>口号（首页大标题）</label>
          <input value={form.slogan} onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))} />
        </div>
        <div className="field">
          <label>专注方向一句话</label>
          <input value={form.focus} onChange={(e) => setForm((f) => ({ ...f, focus: e.target.value }))} />
        </div>
        <div className="field">
          <label>简介正文（Markdown）</label>
          <textarea style={{ minHeight: 180 }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="field">
          <label>历届传承（每行：届次| 一句话，如 2023-2024| 首获ICPC铜奖）</label>
          <textarea style={{ minHeight: 100 }} value={historyText} onChange={(e) => setHistoryText(e.target.value)} />
        </div>
        <div className="field">
          <label>比赛清单（顿号/逗号分隔）</label>
          <textarea value={contestsText} onChange={(e) => setContestsText(e.target.value)} />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>QQ 群</label>
            <input value={contact.qqGroup ?? ""} onChange={(e) => setContact((c) => ({ ...c, qqGroup: e.target.value }))} />
          </div>
          <div className="field">
            <label>邮箱</label>
            <input value={contact.email ?? ""} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>招新文案</label>
          <textarea value={contact.recruitNotice ?? ""} onChange={(e) => setContact((c) => ({ ...c, recruitNotice: e.target.value }))} />
        </div>
        <button className="btn" type="submit">保存简介</button>
      </form>
    </div>
  );
}
