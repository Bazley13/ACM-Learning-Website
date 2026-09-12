/**
 * lib/site-nav.ts —— 全站导航结构与下拉菜单配置
 * 集中维护：新增板块/调整入口只需改这里，导航组件自动生效。
 */

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string; // 无子项时的直达链接
  children?: NavChild[]; // 有子项则渲染下拉菜单
}

/** 首版导航（下拉收纳全部板块） */
export const NAV: NavItem[] = [
  {
    label: "简介",
    children: [
      { label: "关于我们", href: "/about" },
    ],
  },
  {
    label: "公告",
    children: [{ label: "全部公告", href: "/announcements" }],
  },
  {
    label: "笔记",
    children: [
      { label: "全部笔记", href: "/notes" },
      { label: "搜索与筛选", href: "/notes" },
    ],
  },
  {
    label: "可视化实验台",
    children: [{ label: "算法演示与实验台", href: "/visualization" }],
  },
  {
    label: "资源推荐",
    children: [{ label: "竞赛与学习资源", href: "/resources" }],
  },
  {
    label: "荣誉墙",
    children: [{ label: "历届荣誉", href: "/awards" }],
  },
  { label: "管理员", href: "/admin" },
];
