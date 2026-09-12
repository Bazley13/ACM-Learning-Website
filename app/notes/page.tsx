import { getAllNotes, getNoteCategories } from "@/lib/content/loader";
import NoteBrowser from "@/components/NoteBrowser";

export default function NotesListPage() {
  const all = getAllNotes();
  const cats = getNoteCategories();
  const notes = all.map((n) => ({
    slug: n.slug,
    title: n.title,
    category: n.category,
    tags: n.tags,
    date: n.date,
    author: n.author,
    summary: n.summary,
    difficulty: n.difficulty,
  }));

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 28 }}>
        算法笔记
      </h1>
      <p className="muted">工作室成员沉淀的专题笔记，按分类整理，可搜索、筛选、排序。</p>

      <section style={{ marginTop: 16 }}>
        <NoteBrowser notes={notes} categories={cats.map((c) => c.name)} />
      </section>
    </div>
  );
}
