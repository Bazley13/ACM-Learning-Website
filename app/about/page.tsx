import { getIntro } from "@/lib/content/loader";
import { renderMarkdown } from "@/lib/markdown";

export default function AboutPage() {
  const intro = getIntro();
  return (
    <div>
      <h1>关于 {intro.name}</h1>
      <p className="muted" style={{ fontSize: 18 }}>
        {intro.focus}
      </p>

      <section className="card" style={{ marginTop: 20 }}>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(intro.description) }} />
      </section>

      {/* 历届传火 */}
      <section>
        <h2 className="section-title">历届传承</h2>
        <div className="grid">
          {intro.history.map((h) => (
            <div key={h.season} className="card">
              <h3>{h.season}</h3>
              <p>{h.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 比赛清单 */}
      <section>
        <h2 className="section-title">我们参加的比赛</h2>
        <div>
          {intro.contests.map((c) => (
            <span key={c.name} className="badge accent" style={{ fontSize: 14 }}>
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* 联系方式 */}
      <section>
        <h2 className="section-title">招新与联系</h2>
        <div className="card">
          {intro.contact.recruitNotice && (
            <p style={{ color: "var(--accent)", fontWeight: 600 }}>
              {intro.contact.recruitNotice}
            </p>
          )}
          {intro.contact.qqGroup && (
            <p>QQ 群：<b>{intro.contact.qqGroup}</b></p>
          )}
          {intro.contact.email && <p>邮箱：{intro.contact.email}</p>}
        </div>
      </section>
    </div>
  );
}
