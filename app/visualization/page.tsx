import Link from "next/link";
import { getAllVisualizations, getAllLabs } from "@/lib/content/loader";

export default function VisualizationCenterPage() {
  const vizs = getAllVisualizations();
  const labs = getAllLabs();
  const categories = [
    ...new Set([
      ...vizs.map((v) => v.category ?? "未分类"),
      ...labs.map((l) => l.manifest.category ?? "未分类"),
    ]),
  ];

  return (
    <div>
      <h1>可视化与实验台</h1>
      <p className="muted">
        简易演示可直接播放；实验台支持在线调参、填充样例，深度探索复杂算法。
      </p>

      <section className="card" style={{ marginTop: 20 }}>
        {categories.map((c) => (
          <span key={c} className="badge accent" style={{ fontSize: 14 }}>
            {c}
          </span>
        ))}
      </section>

      {/* 简易演示 */}
      <section>
        <h2 className="section-title">🎬 简易演示</h2>
        <div className="grid grid-3">
          {vizs.map((v) => (
            <Link key={v.id} href={`/visualization/${v.id}`} className="card">
              <h3>{v.title}</h3>
              <div className="meta">
                <span className="badge">{v.category ?? "未分类"}</span>
                <span className="badge">{v.data.length} 个元素</span>
              </div>
              {v.description && <p>{v.description}</p>}
            </Link>
          ))}
        </div>
        {vizs.length === 0 && <p className="muted">暂无简易演示，管理员可在后台上传。</p>}
      </section>

      {/* 实验台 */}
      <section>
        <h2 className="section-title">🧪 实验台</h2>
        <div className="grid grid-3">
          {labs.map((l) => (
            <Link key={l.id} href={`/lab/${l.id}`} className="card">
              <h3>{l.manifest.title}</h3>
              <div className="meta">
                <span className="badge">{l.manifest.category ?? "未分类"}</span>
                {l.manifest.author && <span className="badge">{l.manifest.author}</span>}
              </div>
              {l.manifest.description && <p>{l.manifest.description}</p>}
              {l.manifest.params && (
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  可调参数：{l.manifest.params.length} 项
                </p>
              )}
            </Link>
          ))}
        </div>
        {labs.length === 0 && <p className="muted">暂无实验台，管理员可上传 ZIP。</p>}
      </section>
    </div>
  );
}
