import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLabs, getLabById } from "@/lib/content/loader";
import LabHost from "@/components/LabHost";

export function generateStaticParams() {
  return getAllLabs().map((l) => ({ id: l.id }));
}

export default function LabPage({ params }: { params: { id: string } }) {
  const lab = getLabById(params.id);
  if (!lab) notFound();

  return (
    <div>
      <Link href="/visualization" className="muted" style={{ fontSize: 14 }}>
        ← 返回可视化中心
      </Link>
      <h1 style={{ marginTop: 12 }}>{lab.manifest.title}</h1>
      <div className="meta" style={{ marginBottom: 16 }}>
        <span className="badge">{lab.manifest.category ?? "未分类"}</span>
        {lab.manifest.author && <span className="badge">{lab.manifest.author}</span>}
        <span className="badge">v{lab.manifest.version}</span>
      </div>
      {lab.manifest.description && (
        <p className="muted" style={{ marginBottom: 16 }}>
          {lab.manifest.description}
        </p>
      )}
      <LabHost id={lab.id} manifest={lab.manifest} />
    </div>
  );
}
