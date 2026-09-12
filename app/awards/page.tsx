import { getAllAwards } from "@/lib/content/loader";
import AwardWall from "@/components/AwardWall";

export default function AwardsPage() {
  const awards = getAllAwards();

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 28 }}>
        荣誉墙
      </h1>
      <p className="muted">工作室历届参赛获奖证书（电子荣誉墙）。点击任意证书查看详情。</p>

      <section style={{ marginTop: 20 }}>
        {awards.length === 0 ? (
          <p className="muted">暂无荣誉记录。</p>
        ) : (
          <AwardWall awards={awards} />
        )}
      </section>
    </div>
  );
}
