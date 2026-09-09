// 内容层类型定义 —— 与 schemas/*.json 一一对应。
// 页面代码只面向这些类型，不直接碰 content/ 文件（解耦关键）。

/** 算法笔记 front-matter（配合 schemas/note.schema.json） */
export interface Note {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  date: string;
  author: string;
  summary?: string;
  difficulty?: "入门" | "进阶" | "竞赛";
  draft?: boolean;
  visualizationId?: string;
  updated?: string;
  /** 正文 Markdown 原文（由 loader 读入，不在 front-matter） */
  body: string;
}

/** 公告 front-matter（配合 schemas/announcement.schema.json） */
export interface Announcement {
  slug: string;
  title: string;
  type: "招新" | "比赛报名" | "获奖捷报" | "训练通知" | "公告" | "其他";
  date: string;
  pinned?: boolean;
  expires?: string;
  author?: string;
  summary?: string;
  body: string;
}

/** 荣誉墙证书条目（配合 schemas/award.schema.json） */
export interface Award {
  id: string;
  competition: string;
  level: string;
  title: string;
  awardDate: string;
  season?: string;
  members?: string[];
  image: string;
  note?: string;
}

/** 工作室简介（配合 schemas/intro.schema.json） */
export interface Intro {
  name: string;
  slogan: string;
  logo?: string;
  description: string;
  focus?: string;
  history: { season: string; summary: string }[];
  contests: { name: string; type?: string }[];
  contact: {
    email?: string;
    qqGroup?: string;
    banner?: string;
    recruitNotice?: string;
  };
}

/** 简易档可视化（配合 visualization-format/visualization.schema.json） */
export interface Visualization {
  id: string;
  schemaVersion: string;
  title: string;
  type: "array" | "linked-list" | "tree" | "graph" | "board";
  category?: string;
  description?: string;
  tags?: string[];
  data: (number | string)[];
  config?: Record<string, unknown>;
  init?: { pointers?: LabPointer[]; marks?: VisualizationMark[] };
  steps: VisualizationFrame[];
}

export interface VisualizationMark {
  indices: number[];
  color?: ColorToken;
  label?: string;
}
export interface LabPointer {
  name: string;
  index: number;
  color?: ColorToken;
  label?: string;
}
export interface VisualizationFrame {
  note?: string;
  marks?: VisualizationMark[];
  pointers?: LabPointer[];
  set?: { index: number; value: number | string; color?: ColorToken }[];
  swap?: { a: number; b: number; color?: ColorToken };
}
export type ColorToken =
  | "compare" | "current" | "visited" | "sorted" | "swap" | "error" | "default";

/** 实验台小程序清单（配合 visualization-format/app-manifest.schema.json） */
export interface LabManifest {
  id: string;
  title: string;
  category: string;
  version: string;
  author: string;
  entry: string;
  files: string[];
  params?: LabParam[];
  samples?: { name: string; params: Record<string, unknown> }[];
  description?: string;
  previewImage?: string;
  minHostApi: string;
}

export type ParamType =
  | "number" | "integer" | "text" | "select" | "checkbox" | "range" | "color";

export interface LabParam {
  name: string;
  label: string;
  type: ParamType;
  default?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}
