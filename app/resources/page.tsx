import { ExternalLink } from "lucide-react";
import {
  SiCodeforces,
  SiLeetcode,
  SiCodechef,
  SiYoutube,
  SiBilibili,
  SiHackerrank,
  SiWikipedia,
} from "react-icons/si";
import {
  FaCode,
  FaBookOpen,
  FaLightbulb,
  FaTools,
  FaYoutube,
  FaGraduationCap,
  FaGlobe,
  FaFlask,
} from "react-icons/fa";
import { getAllResources } from "@/lib/content/loader";
import type { ResourceItem } from "@/lib/content/types";

/** 洛谷 —— 简洁的红字「洛」标（react-icons 无官方品牌，用内联 SVG 占位） */
function LuoguIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#ef4444" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">洛</text>
    </svg>
  );
}
/** 牛客 —— 蓝底白「牛」字标 */
function NowcoderIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#2563eb" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">牛</text>
    </svg>
  );
}

/** 图标 key -> 组件（品牌 logo 用 react-icons，通用用 lucide/fa） */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; title?: string }>> = {
  luogu: LuoguIcon,
  nowcoder: NowcoderIcon,
  codeforces: SiCodeforces,
  leetcode: SiLeetcode,
  codechef: SiCodechef,
  bilibili: SiBilibili,
  youtube: SiYoutube,
  hackerrank: SiHackerrank,
  wikipedia: SiWikipedia,
  code: FaCode,
  book: FaBookOpen,
  lightbulb: FaLightbulb,
  tools: FaTools,
  youtube2: FaYoutube,
  graduation: FaGraduationCap,
  globe: FaGlobe,
  flask: FaFlask,
};

/** 语义色 key -> 圆标颜色 */
const DOT_COLOR: Record<string, string> = {
  ac: "var(--green)",
  highlight: "var(--amber)",
  tle: "var(--purple)",
  primary: "var(--accent)",
  wa: "var(--red)",
};

function ResourceCard({ item }: { item: ResourceItem }) {
  const Icon = ICON_MAP[item.icon] ?? FaGlobe;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card resource-card"
    >
      <div className="resource-main">
        <div className="resource-icon" aria-hidden>
          <Icon size={22} />
        </div>
        <div className="resource-info">
          <h3>
            {item.name}
            <ExternalLink size={13} className="resource-link-icon" />
          </h3>
          {item.desc && <p>{item.desc}</p>}
          {item.tags && item.tags.length > 0 && (
            <div className="resource-tags">
              {item.tags.map((t) => (
                <span key={t} className="badge">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

const DESCRIPTION_BY_GROUP: Record<string, string> = {
  oj: "主流在线评测与竞赛平台",
  learn: "系统学习与查询资料",
  video: "B 站与 YouTube 优质讲解",
  tools: "可视化、排版与刷题工具",
};

export default function ResourcesPage() {
  const categories = getAllResources();

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 28 }}>
        资源推荐
      </h1>
      <p className="muted">
        面向算法竞赛爱好者的精选学习与参赛资源，按分类整理，点击卡片直达。
      </p>

      {categories.length === 0 && <p className="muted">暂无资源。可在后台 / content 补充。</p>}

      <div style={{ marginTop: 8 }}>
        {categories.map((cat) => (
          <section key={cat.id} style={{ marginTop: 24 }}>
            <div className="resource-group-head">
              <span
                className="resource-dot"
                style={{ background: DOT_COLOR[cat.color] ?? "var(--accent)" }}
                aria-hidden
              />
              <h2 className="section-title" style={{ margin: 0 }}>
                {cat.name}
              </h2>
              <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>
                {cat.description || DESCRIPTION_BY_GROUP[cat.id] || ""}
              </span>
            </div>
            <div className="grid grid-3" style={{ marginTop: 12 }}>
              {cat.items.map((item) => (
                <ResourceCard key={item.name} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
