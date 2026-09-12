import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllNotes, getNoteBySlug } from "@/lib/content/loader";
import { renderMarkdownWithOutline } from "@/lib/markdown";
import NoteOutline from "@/components/NoteOutline";
import NoteFeedback from "@/components/NoteFeedback";

export function generateStaticParams() {
  return getAllNotes().map((n) => ({ slug: n.slug }));
}

export default function NoteDetailPage({ params }: { params: { slug: string } }) {
  const note = getNoteBySlug(params.slug);
  if (!note) notFound();

  const { html, outline } = renderMarkdownWithOutline(note.body, {
    imagePrefix: `/notes-assets/${encodeURIComponent(note.category)}/`,
  });



  return (
    <div>
      <Link href="/notes" className="muted" style={{ fontSize: 14 }}>
        ← 返回笔记列表
      </Link>

      {/* 标题与元信息 */}
      <header className="note-head">
        <h1>{note.title}</h1>
        <div className="meta">
          <span className="badge accent">{note.category}</span>
          {note.difficulty && (
            <span className={note.difficulty === "入门" ? "badge green" : note.difficulty === "进阶" ? "badge amber" : "badge red"}>
              {note.difficulty}
            </span>
          )}
          {note.date} · {note.author}
          {note.tags.map((t) => (
            <span key={t} className="badge">
              #{t}
            </span>
          ))}
        </div>
        {note.updated && (
          <div className="muted" style={{ fontSize: 13 }}>
            更新于 {note.updated}
          </div>
        )}
      </header>

      {/* 正文：大纲 + 内容 */}
      <div className="note-layout">
        <NoteOutline outline={outline} />
        <article
          className="note-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* 反馈按钮 */}
      <div className="note-feedback-wrap">
        <NoteFeedback slug={note.slug} title={note.title} />
      </div>
    </div>
  );
}
