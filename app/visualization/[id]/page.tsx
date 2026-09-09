import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVisualizations, getVisualizationById } from "@/lib/content/loader";
import VizPlayer from "@/components/VizPlayer";

export function generateStaticParams() {
  return getAllVisualizations().map((v) => ({ id: v.id }));
}

export default function VisualizationDetailPage({ params }: { params: { id: string } }) {
  const viz = getVisualizationById(params.id);
  if (!viz) notFound();

  return (
    <div>
      <Link href="/visualization" className="muted" style={{ fontSize: 14 }}>
        ← 返回可视化中心
      </Link>
      <h1 style={{ marginTop: 12 }}>{viz.title}</h1>
      <div className="meta" style={{ marginBottom: 16 }}>
        <span className="badge">{viz.category ?? "未分类"}</span>
        {viz.tags?.map((t) => (
          <span key={t} className="badge">
            #{t}
          </span>
        ))}
      </div>
      <VizPlayer viz={viz} />
    </div>
  );
}
