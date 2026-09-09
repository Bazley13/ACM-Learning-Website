import { getAllAwards, getAwardCompetitions, awardImagePublicPath } from "@/lib/content/loader";

export default function AwardsPage() {
  const awards = getAllAwards();
  const contests = getAwardCompetitions();

  return (
    <div>
      <h1>荣誉墙</h1>
      <p className="muted">工作室历届参赛获奖证书（电子荣誉墙）。</p>

      <section className="card" style={{ marginTop: 20 }}>
        {contests.map((c) => (
          <span key={c} className="badge accent" style={{ fontSize: 14 }}>
            {c}
          </span>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        {awards.length === 0 && <p className="muted">暂无荣誉记录。</p>}
        <div className="grid grid-3">
          {awards.map((a) => (
            <div key={a.id} className="card award-card">
              <h3>
                [{a.competition}] {a.title}
              </h3>
              <div className="meta">
                <span className="badge">{a.level}</span>
                {a.season && <span className="badge">{a.season}</span>}
                {" · "} {a.awardDate}
              </div>
              {a.members && (
                <p className="muted" style={{ fontSize: 13 }}>
                  成员：{a.members.join("、")}
                </p>
              )}
              {/* 证书大图：点击放大用简单锚点；首版以同页展示为主 */}
              <a href={awardImagePublicPath(a.image)} target="_blank" rel="noopener noreferrer">
                <img src={awardImagePublicPath(a.image)} alt={`${a.competition} ${a.title}`} loading="lazy" />
              </a>
              {a.note && <p className="muted" style={{ marginTop: 8 }}>{a.note}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
