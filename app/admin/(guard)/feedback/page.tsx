"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trash2, Circle } from "lucide-react";

interface FeedbackItem {
  file: string;
  slug: string;
  title: string;
  location: string;
  detail: string;
  contact: string;
  submittedAt: string;
  handled: boolean;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await fetch("/admin/api/feedback");
      const data = await res.json();
      if (!data.ok) throw new Error((data.errors ?? []).join("；"));
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "加载失败");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setHandled(item: FeedbackItem, handled: boolean) {
    await fetch("/admin/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: item.file, handled }),
    });
    load();
  }

  async function remove(item: FeedbackItem) {
    if (!confirm(`删除该条反馈？\n\n${item.title}：${item.detail}`)) return;
    await fetch("/admin/api/feedback?file=" + encodeURIComponent(item.file), { method: "DELETE" });
    load();
  }

  return (
    <div style={{ maxWidth: 840 }}>
      <h2>笔记反馈</h2>
      <p className="muted" style={{ marginTop: 4 }}>
        来自阅读者在笔记详情页提交的错误反馈，可标记「已处理」或删除。
      </p>
      {err && <div className="notice err">{err}</div>}
      {!items ? (
        <p className="muted" style={{ marginTop: 16 }}>
          加载中…
        </p>
      ) : items.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>
          暂无反馈。
        </p>
      ) : (
        <div className="grid" style={{ marginTop: 16 }}>
          {items.map((f) => (
            <div key={f.file} className={"card" + (f.handled ? " fb-handled" : "")}>
              <div className="fb-head">
                <div>
                  <b>《{f.title}》</b>
                  <span className="badge accent" style={{ marginLeft: 8 }}>
                    {f.slug}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(f.submittedAt).toLocaleString("zh-CN")}
                </span>
              </div>
              {f.location && <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>位置：{f.location}</p>}
              <p style={{ margin: "6px 0 0" }}>{f.detail}</p>
              {f.contact && <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>联系方式：{f.contact}</p>}
              <div className="fb-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setHandled(f, !f.handled)}
                >
                  {f.handled ? <Circle size={14} /> : <CheckCircle2 size={14} />}
                  {f.handled ? "标记未处理" : "标记已处理"}
                </button>
                <button type="button" className="btn ghost fb-del" onClick={() => remove(f)}>
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
