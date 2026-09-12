// 反馈读取/更新/删除（内容层）。前台写入 content/feedback/*.json，后台在此管理。
import fs from "node:fs";
import path from "node:path";

const FEEDBACK_DIR = path.join(process.cwd(), "content", "feedback");

/** 反馈文件结构（由 /api/feedback 写入） */
export interface FeedbackItem {
  slug: string;
  title: string;
  location: string;
  detail: string;
  contact: string;
  submittedAt: string;
  handled: boolean;
}

export function listFeedback(): { file: string; item: FeedbackItem }[] {
  if (!fs.existsSync(FEEDBACK_DIR)) return [];
  return fs
    .readdirSync(FEEDBACK_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const item = JSON.parse(fs.readFileSync(path.join(FEEDBACK_DIR, f), "utf8")) as FeedbackItem;
        return { file: f, item };
      } catch {
        return null;
      }
    })
    .filter((x): x is { file: string; item: FeedbackItem } => x !== null)
    .sort((a, b) => b.item.submittedAt.localeCompare(a.item.submittedAt));
}

export function feedbackAbsPath(file: string): string | undefined {
  const name = path.basename(file);
  if (!name.endsWith(".json")) return undefined;
  const abs = path.join(FEEDBACK_DIR, name);
  return fs.existsSync(abs) ? abs : undefined;
}
