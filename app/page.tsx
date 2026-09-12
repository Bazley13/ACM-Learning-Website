import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import {
  getIntro,
  getPinnedAnnouncements,
  getAllNotes,
  getAllAwards,
  getAllLabs,
  getAllVisualizations,
  getAllPhotos,
} from "@/lib/content/loader";
import AeroShardsCanvas from "@/components/AeroShardsCanvas";
import ParticleText from "@/components/ParticleText";
import DepthCarousel from "@/components/DepthCarousel";
import Slide3D from "@/components/Slide3D";

export default function HomePage() {
  const intro = getIntro();
  const pinned = getPinnedAnnouncements();
  const allAwards = getAllAwards();
  const vizCount = getAllVisualizations().length;
  const labCount = getAllLabs().length;
  const noteCount = getAllNotes().length;
  const photos = getAllPhotos();

  const stats = [
    { value: noteCount, label: "算法笔记" },
    { value: vizCount, label: "算法演示" },
    { value: labCount, label: "实验台" },
    { value: allAwards.length, label: "历届荣誉" },
  ];

  return (
    <>
      {/* 三屏幻灯片式滚动切换 */}
      <div className="home-slides">
        {/* 屏 1：首屏 Hero */}
        <section className="slide hero-slide" id="s1">
          <AeroShardsCanvas placement="full" />
          <div className="hero-inner">
            <h1>DLNU·ACM</h1>
            <p className="hero-slogan">以代码为笔，讲清每一道算法</p>
            <p className="hero-sub">专注算法竞赛的程序设计工作室</p>
            <div className="hero-actions">
              <a className="btn hero-btn-solid" href="#s2">
                了解工作室 <ArrowRight size={15} />
              </a>
              <a className="btn hero-btn-ghost" href="/visualization">
                <FlaskConical size={15} /> 算法可视化
              </a>
            </div>
          </div>
          <div className="scroll-hint" aria-hidden>
            <span>下滑进入工作室</span>
          </div>
        </section>

        {/* 屏 2：简介 + 公告（居中单栏，兼容窄/矮视口不越界） */}
        <section className="slide about-slide" id="s2">
          <div className="s2-inner">
            <div className="s2-head">
              <div className="slide-kicker">ABOUT THE STUDIO</div>
              <h2>工作室简介</h2>
              <p className="about-text">
                {intro.description}
                <Link className="accent" href="/about"> 了解更多 →</Link>
              </p>
            </div>
            <div className="about-stats">
              {stats.map((s) => (
                <div key={s.label} className="about-stat">
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <aside className="announce-panel s2-announce">
              <div className="announce-title">公告</div>
              {pinned.length === 0 && <div className="muted">暂无置顶公告</div>}
              {pinned.map((a) => (
                <Link key={a.slug} href="/announcements" className="announce-item">
                  <b>{a.title}</b>
                  <span className="muted">{a.date}</span>
                </Link>
              ))}
            </aside>
          </div>
          <div className="more-row">
            <Link href="#s3" className="slide-down">
              比赛 · 日常 <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* 屏 3：左侧 ParticleText“ACM”，右侧 3D 深度轮播 */}
        <section className="slide gallery-slide" id="s3">
          <div className="gallery-inner">
            <div className="gallery-left">
              <div className="gallery-acm">
                <ParticleText
                  text="ACM"
                  particleSize={2}
                  density={7}
                  color="#e8edf5"
                  highlightColor="#d9a83a"
                  scatter={190}
                  gatherDuration={1500}
                  stagger={420}
                  pointerRepel={46}
                  repelRadius={150}
                  idleDrift={0.15}
                  fontSize="clamp(5.5rem, 19vw, 12.5rem)"
                  fontWeight={900}
                  glow
                />
              </div>
              <div className="gallery-caption">
                <span>ACM · algorithmic coding master</span>
              </div>
            </div>
            <div className="gallery-right">
              <div className="gallery-title">
                <h2>比赛 · 日常</h2>
                <span className="muted">现场与工作室的瞬间</span>
              </div>
              <DepthCarousel items={photos} />
            </div>
          </div>
        </section>
      </div>
      <Slide3D />
    </>
  );
}
