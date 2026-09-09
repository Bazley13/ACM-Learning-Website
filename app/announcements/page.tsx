import Link from "next/link";
import { getAllAnnouncements, getPinnedAnnouncements } from "@/lib/content/loader";
import { renderMarkdown } from "@/lib/markdown";

const TYPE_LABEL: Record<string, string> = {
  "招新": "招新",
  "比赛报名": "比赛报名",
  "获奖捷报": "获奖捷报",
  "训练通知": "训练通知",
  "公告": "公告",
  "其他": "其他",
};

export default function AnnouncementsPage() {
  const all = getAllAnnouncements();
  const pinned = getPinnedAnnouncements();

  return (
    <div>
      <h1>公告</h1>
      <p className="muted">招新、比赛报名、获奖捷报与训练通知。</p>

      <section style={{ marginTop: 24 }}>
        {all.map((a) => (
          <article
            key={a.slug}
            className={
              "card announce" + (a.pinned ? " pinned" : "")
            }
            style={{ marginBottom: 16 }}
          >
            <h3>
              {a.pinned && <span style={{ color: "var(--green)", marginRight: 6 }}>📌</span>}
              {a.title}
            </h3>
            <div className="meta">
              <span className={"badge " + (a.pinned ? "green" : "accent")}>
                {TYPE_LABEL[a.type] ?? a.type}
              </span>
              {a.date} · {a.author ?? ""}
            </div>
            {a.summary && <p>{a.summary}</p>}
            <details>
              <summary style={{ cursor: "pointer", color: "var(--accent)", marginTop: 8 }}>
                查看全文
              </summary>
              <div style={{ marginTop: 8, fontSize: 15 }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />
              </div>
            </details>
          </article>
        ))}
      </section>

      {all.length === 0 && (
        <p className="muted" style={{ marginTop: 24 }}>
          暂无公告。
        </p>
      )}
    </div>
  );
}
