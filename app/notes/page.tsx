import Link from "next/link";
import { getAllNotes, getNoteCategories } from "@/lib/content/loader";

export default function NotesListPage() {
  const notes = getAllNotes();
  const cats = getNoteCategories();

  return (
    <div>
      <h1>算法笔记</h1>
      <p className="muted">工作室成员沉淀的专题笔记，按分类整理。</p>

      <section className="card" style={{ marginTop: 20 }}>
        {cats.map((c) => (
          <span key={c.name} className="badge accent" style={{ fontSize: 14 }}>
            {c.name} ({c.count})
          </span>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="grid grid-2">
          {notes.map((n) => (
            <Link key={n.slug} href={`/notes/${n.slug}`} className="card">
              <h3>{n.title}</h3>
              <div className="meta">
                <span className="badge">{n.category}</span>
                {n.difficulty && <span className="badge amber">{n.difficulty}</span>}
                {n.date} · {n.author}
              </div>
              {n.summary && <p>{n.summary}</p>}
              {n.tags.map((t) => (
                <span key={t} className="badge">
                  #{t}
                </span>
              ))}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
