"use client";

import { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Award } from "@/lib/content/types";
import { awardImagePublicPath } from "@/lib/content/urls";
import DriftWall from "@/components/DriftWall";
import Reveal from "@/components/Reveal";

/**
 * 荣誉墙展示层：
 *  - variant="home"：整页漂移墙（占满页面，底端标题说明）+ 下滑平滑浮现的筛选卡片网格
 *  - variant="page"：常规漂移墙（固定高度）+ 筛选卡片网格
 *  两种形态共用同一个 lightbox（含左右切换），数据由父（server 页面）传入。
 */
export default function AwardWall({
  awards,
  variant = "page",
}: {
  awards: Award[];
  variant?: "home" | "page";
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [comp, setComp] = useState("全部");
  const [level, setLevel] = useState("全部");
  const [season, setSeason] = useState("全部");

  const competitions = useMemo(
    () => ["全部", ...new Set(awards.map((a) => a.competition))],
    [awards]
  );
  const levels = useMemo(
    () => ["全部", ...new Set(awards.map((a) => a.level))],
    [awards]
  );
  const seasons = useMemo(
    () => ["全部", ...new Set(awards.map((a) => a.season).filter(Boolean))] as string[],
    [awards]
  );

  const filtered = useMemo(
    () =>
      awards
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => {
          if (comp !== "全部" && a.competition !== comp) return false;
          if (level !== "全部" && a.level !== level) return false;
          if (season !== "全部" && a.season !== season) return false;
          return true;
        }),
    [awards, comp, level, season]
  );

  const cur = index !== null ? awards[index] : null;
  const driftItems = awards.map((a, i) => ({
    image: awardImagePublicPath(a.image),
    title: `${a.competition} ${a.title}`,
    index: i,
  }));

  const close = () => setIndex(null);
  const prev = () =>
    setIndex((i) => (i === null ? i : (i - 1 + awards.length) % awards.length));
  const next = () =>
    setIndex((i) => (i === null ? i : (i + 1) % awards.length));

  if (awards.length === 0) return null;

  const wall =
    variant === "home" ? (
      <div className="honors-wall">
        <div className="honors-frame">
          <DriftWall items={driftItems} columns={4} onSelect={setIndex} />
          <div className="honors-caption">
            <div className="tag">RECENT HONORS · 近两年</div>
            <h2>荣誉墙</h2>
            <p>近两年赛场成果一览 · 继续下滑查看按赛事 / 级别 / 赛季筛选的获奖记录</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="award-wall" style={{ height: 520 }}>
        <DriftWall items={driftItems} columns={4} onSelect={setIndex} />
      </div>
    );

  return (
    <div className={variant === "home" ? "honors-full" : undefined}>
      {wall}

      {/* 下滑平滑浮现的筛选卡片网格 */}
      <Reveal className="container honors-filter">
        <div className="card note-toolbar" style={{ marginBottom: 16 }}>
          <div className="note-filters">
            <select value={comp} onChange={(e) => setComp(e.target.value)} aria-label="按赛事筛选">
              {competitions.map((c) => (
                <option key={c} value={c}>
                  赛事：{c}
                </option>
              ))}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="按级别筛选">
              {levels.map((l) => (
                <option key={l} value={l}>
                  级别：{l}
                </option>
              ))}
            </select>
            <select value={season} onChange={(e) => setSeason(e.target.value)} aria-label="按赛季筛选">
              {seasons.map((s) => (
                <option key={s} value={s}>
                  赛季：{s}
                </option>
              ))}
            </select>
          </div>
          <span className="note-count" style={{ margin: 0, marginLeft: "auto" }}>
            共 {filtered.length} 项荣誉
          </span>
        </div>

        <div className="grid grid-3">
          {filtered.map(({ a, i }) => (
            <button
              key={a.id}
              type="button"
              className="card award-card"
              style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => setIndex(i)}
            >
              <h3>
                [{a.competition}] {a.title}
              </h3>
              <div className="meta">
                <span className="badge accent">{a.level}</span>
                {a.season && <span className="badge">{a.season}</span>}
                {" · "}
                {a.awardDate}
              </div>
              {a.members && a.members.length > 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  成员：{a.members.join("、")}
                </p>
              )}
              <img src={awardImagePublicPath(a.image)} alt={`${a.competition} ${a.title}`} loading="lazy" />
            </button>
          ))}
        </div>
      </Reveal>

      {/* lightbox */}
      {cur && (
        <div className="modal-mask" onClick={close}>
          <div className="award-lightbox" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <img src={awardImagePublicPath(cur.image)} alt={`${cur.competition} ${cur.title}`} />
            <div className="lb-body">
              <p className="lb-title">
                [{cur.competition}] {cur.title}
              </p>
              <p className="lb-meta">
                <span className="badge accent">{cur.level}</span>
                {cur.season && <span className="badge">{cur.season}</span>}
                {" · "}
                {cur.awardDate}
                {cur.members && cur.members.length > 0 && (
                  <span> · 成员：{cur.members.join("、")}</span>
                )}
              </p>
              {cur.note && <p className="lb-note">{cur.note}</p>}
            </div>
            <div className="lb-nav">
              <button type="button" className="lb-nav-btn" onClick={prev} disabled={awards.length <= 1} aria-label="上一张">
                <ChevronLeft size={16} /> 上一张
              </button>
              <span className="lb-counter">
                {index! + 1} / {awards.length}
              </span>
              <button type="button" className="lb-nav-btn" onClick={next} disabled={awards.length <= 1} aria-label="下一张">
                下一张 <ChevronRight size={16} />
              </button>
            </div>
            <div className="lb-nav" style={{ borderTop: "none", paddingTop: 0, justifyContent: "flex-end" }}>
              <button type="button" className="lb-nav-btn" onClick={close} aria-label="关闭">
                <X size={16} /> 关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
