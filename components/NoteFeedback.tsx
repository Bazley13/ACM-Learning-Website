"use client";

import { useEffect, useState } from "react";
import { Bug, X } from "lucide-react";

const FORM_ID = "feedback-submitted";
const RATE_KEY = "dlmu-feedback-last";

/** 笔记详情页反馈：访客标出错误位置 + 说明，写入 content/feedback（仅后台可见）。 */
export default function NoteFeedback({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  // 已提交过则不再弹（本机）
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(FORM_ID)) setDone(true);
  }, []);

  async function submit() {
    if (!detail.trim()) {
      setState("err");
      setErrMsg("请填写问题说明。");
      return;
    }
    // 轻量防刷：1 分钟内仅一次
    const last = Number(localStorage.getItem(RATE_KEY) ?? 0);
    if (Date.now() - last < 60_000) {
      setState("err");
      setErrMsg("提交过于频繁，请稍后再试。");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, location, detail, contact }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.errors?.[0] ?? "提交失败");
      localStorage.setItem(FORM_ID, "1");
      localStorage.setItem(RATE_KEY, String(Date.now()));
      setState("ok");
      setDone(true);
    } catch (e) {
      setState("err");
      setErrMsg(e instanceof Error ? e.message : "提交失败，请稍后再试。");
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn ghost btn-feedback"
        onClick={() => setOpen((v) => !v)}
        aria-label="反馈问题"
      >
        <Bug size={16} /> 反馈问题
      </button>

      {open && (
        <div className="modal-mask" onClick={() => setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>反馈笔记问题</b>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <p className="modal-ok">感谢反馈！我们会核对并完善这篇笔记。</p>
            ) : (
              <>
                <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  面向《{title}》，指出错误位置并说明，帮助我们持续完善内容。
                </p>
                <div className="field">
                  <label>错误位置（章节/段落，可选）</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：『复杂度』一节 / 第二段"
                  />
                </div>
                <div className="field">
                  <label>问题说明 *</label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="描述错误或疑问…"
                  />
                </div>
                <div className="field">
                  <label>联系方式（可选）</label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="QQ / 邮箱，便于我们答复"
                  />
                </div>
                {state === "err" && <div className="notice err">{errMsg}</div>}
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={submit} disabled={state === "sending"}>
                    {state === "sending" ? "提交中…" : "提交反馈"}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
