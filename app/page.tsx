import Link from "next/link";
import {
  getIntro,
  getPinnedAnnouncements,
  getAllNotes,
  getAllAwards,
  getAllLabs,
  getAllVisualizations,
} from "@/lib/content/loader";

export default function HomePage() {
  const intro = getIntro();
  const pinned = getPinnedAnnouncements();
  const notes = getAllNotes().slice(0, 4);
  const awards = getAllAwards().slice(0, 6);
  const vizCount = getAllVisualizations().length;
  const labCount = getAllLabs().length;

  return (
    <div>
      {/* 简介 Hero */}
      <section style={{ padding: "60px 0 36px", textAlign: "center" }}>
        <h1 style={{ fontSize: 44, margin: 0, letterSpacing: 1 }}>
          {intro.slogan}
        </h1>
        <p className="muted" style={{ fontSize: 18, marginTop: 12 }}>
          {intro.focus}
        </p>
        <div style={{ marginTop: 20 }}>
          <Link className="btn" href="/about">
            了解工作室
          </Link>{" "}
          <Link className="btn ghost" href="/visualization">
            体验实验台
          </Link>
        </div>
      </section>

      {/* 置顶公告 */}
      {pinned.length > 0 && (
        <section>
          <h2 className="section-title">📌 置顶公告</h2>
          <div className="grid">
            {pinned.map((a) => (
              <Link
                key={a.slug}
                href="/announcements"
                className="card announce pinned"
              >
                <h3>{a.title}</h3>
                <div className="meta">
                  <span className="badge green">{a.type}</span>
                  {a.date} · {a.author ?? ""}
                </div>
                {a.summary && <p>{a.summary}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        {/* 最新笔记 */}
        <section>
          <h2 className="section-title">📝 最新笔记</h2>
          <div className="grid">
            {notes.map((n) => (
              <Link key={n.slug} href={`/notes/${n.slug}`} className="card">
                <h3>{n.title}</h3>
                <div className="meta">
                  <span className="badge">{n.category}</span>
                  {n.date} · {n.author}
                </div>
                {n.summary && <p>{n.summary}</p>}
              </Link>
            ))}
          </div>
          <Link href="/notes" style={{ fontSize: 14 }}>
            全部笔记 →
          </Link>
        </section>

        {/* 可视化入口 */}
        <section>
          <h2 className="section-title">🧪 可视化与实验台</h2>
          <div className="card">
            <p>
              目前已有 <b>{vizCount}</b> 个算法演示、<b>{labCount}</b> 个交互实验台。
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              实验台可以在线调参、填充样例，适合复杂算法的直观探索。
            </p>
            <div style={{ marginTop: 14 }}>
              <Link className="btn" href="/visualization">
                进入可视化中心
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 荣誉墙预览 */}
      <section>
        <h2 className="section-title">🏆 荣誉墙</h2>
        <div className="grid grid-3">
          {awards.map((a) => (
            <div key={a.id} className="card award-card">
              <h3>
                [{a.competition}] {a.title}
              </h3>
              <div className="meta">
                {a.level} · {a.awardDate}
                {a.season && <span className="badge">{a.season}</span>}
              </div>
            </div>
          ))}
        </div>
        <Link href="/awards" style={{ fontSize: 14 }}>
          查看全部荣誉 →
        </Link>
      </section>
    </div>
  );
}
