import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllNotes, getNoteBySlug, getVisualizationById, getLabById } from "@/lib/content/loader";
import { renderMarkdown } from "@/lib/markdown";

export function generateStaticParams() {
  return getAllNotes().map((n) => ({ slug: n.slug }));
}

export default function NoteDetailPage({ params }: { params: { slug: string } }) {
  const note = getNoteBySlug(params.slug);
  if (!note) notFound();

  let vizLink: { href: string; label: string } | null = null;
  if (note.visualizationId) {
    if (getVisualizationById(note.visualizationId)) {
      vizLink = { href: `/visualization/${note.visualizationId}`, label: "播放演示" };
    } else if (getLabById(note.visualizationId)) {
      vizLink = { href: `/lab/${note.visualizationId}`, label: "打开实验台" };
    }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <Link href="/notes" className="muted" style={{ fontSize: 14 }}>
        ← 返回笔记列表
      </Link>
      <h1 style={{ marginTop: 12 }}>{note.title}</h1>
      <div className="meta" style={{ marginBottom: 20 }}>
        <span className="badge">{note.category}</span>
        {note.difficulty && <span className="badge amber">{note.difficulty}</span>}
        {note.date} · {note.author}
        {note.tags.map((t) => (
          <span key={t} className="badge">
            #{t}
          </span>
        ))}
      </div>

      {vizLink && (
        <p>
          <Link className="btn" href={vizLink.href}>
            {vizLink.label} →
          </Link>
        </p>
      )}

      <article
        className="card"
        style={{ fontSize: 16 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body) }}
      />
    </div>
  );
}
