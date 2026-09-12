/**
 * lib/theme.ts —— 全站语义色令牌 · 单一来源
 *
 * 本文件是配色系统的"唯一权威数值来源"：
 *  - app/globals.css 的 `:root` CSS 变量值与这里一一对应（运行时主题走 CSS 变量）；
 *  - 新代码（组件、内联样式）统一从这里 import 十六进值，不手写散落的颜色。
 *  - 与可视化（VizPlayer / LabHost）的语义色天然一致。
 *
 * 体系：ICPC 红黄蓝为主干 + 竞赛语义色（绿AC / 红WA / 黄高亮 / 紫TLE / 灰蓝次级）。
 * 主调：以蓝为主、整体明亮（VSCode 浅色主题质感），不晦暗。
 */

/** 基础调色板（十六进制原始值） */
export const palette = {
  /** ICPC 三主色 */
  blue: "#3b82f6", // 主色：导航/链接/按钮/信息
  yellow: "#f59e0b", // 高亮/标注/强调
  red: "#ef4444", // 错误/报错/竞赛级难度

  /** 竞赛语义扩展色 */
  green: "#22c55e", // 绿 AC：通过/正确/入门难度/运行成功/金奖
  purple: "#a855f7", // 紫 TLE：超时/特殊状态/装饰点缀
  slate: "#64748b", // 灰蓝：次级文本/边框/辅助

  /** 主色深浅（派生，供 hover/强调使用） */
  blueStrong: "#2563eb",
} as const;

/** 语义命名（面向业务语义，便于阅读与扩展） */
export const semantic = {
  ac: palette.green, // 通过 / 正确 / 入门难度 / 运行成功 / 金奖
  wa: palette.red, // 错误 / 报错 / 竞赛难度 / 反馈问题
  highlight: palette.yellow, // 高亮 / 标注 / 进阶难度
  primary: palette.blue, // 主色（导航/链接/按钮）
  tle: palette.purple, // 超时 / 特殊状态
  secondary: palette.slate, // 次级文本 / 边框
} as const;

export type SemanticKey = keyof typeof semantic;

/** 难度 → 语义色（笔记/资源卡片徽章用） */
export const difficultySemantic: Record<string, SemanticKey> = {
  入门: "ac",
  进阶: "highlight",
  登峰: "wa",
};

/** 赛事级别 → 语义色（荣誉墙金牌用） */
export const medalSemantic: Record<string, SemanticKey> = {
  金奖: "ac",
  银奖: "highlight",
  铜奖: "wa",
  优秀奖: "primary",
};
