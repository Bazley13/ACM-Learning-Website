
# DLNU-ACM 工作室官网

> 大连民族大学 ACM 工作室官方网站
> 面向工作室成员、算法竞赛学习者与访客，提供工作室介绍、算法笔记、赛事荣誉、资源推荐以及算法可视化实验台等功能。

## 项目简介

本项目是 DLNU-ACM 工作室官网，采用 **Next.js + TypeScript** 构建。

项目的核心设计理念是 **“内容与代码分离、内容即资产、持续可交接”**：

* 网站内容统一存放在 `content/` 目录中；
* 笔记、公告等内容使用 Markdown / JSON 文件管理；
* 内容纳入 Git 版本控制，可以追踪修改、回滚和跨届交接；
* 管理员可以通过 `/admin` 后台直接管理网站内容；
* 后台保存内容后可自动进行 Git 提交，减少手动维护成本；
* 新增内容通常不需要修改网站代码。

---

## 主要功能

### 前台

| 模块         | 功能                                           |
| ------------ | ---------------------------------------------- |
| 首页         | 工作室介绍、公告、ACM 粒子效果、比赛与日常照片 |
| 算法笔记     | 分类、搜索、筛选、详情阅读、Markdown 渲染      |
| 公告         | 工作室通知、活动公告、置顶与过期               |
| 荣誉墙       | ICPC、CCPC、蓝桥杯等比赛获奖信息及证书展示     |
| 资源推荐     | 洛谷、Codeforces、牛客、OI-Wiki 等学习资源     |
| 可视化实验台 | 算法可视化演示及交互式实验                     |
|  工作室简介 | 工作室介绍、比赛经历等                         |

### 管理后台

访问：

```text
/admin
```

目前支持：

* 公告发布、编辑、删除
* 算法笔记新增、编辑、删除
* 工作室简介编辑
* 荣誉墙证书管理
* 资源推荐管理
* 首页照片轮播管理
* 可视化 / 实验台管理
* Markdown 编辑与实时预览
* 图片上传
* 内容格式校验
* 保存后自动 Git 提交

目前采用**单管理员账号**，后续可以根据需要扩展成员权限体系。

---

## 技术栈

| 技术                   | 用途                       |
| ---------------------- | -------------------------- |
| **Next.js**      | 前端框架及全栈路由         |
| **TypeScript**   | 开发语言                   |
| **Markdown**     | 算法笔记、公告等内容       |
| **JSON**         | 结构化内容数据             |
| **Git**          | 代码及内容版本管理         |
| **marked**       | Markdown 渲染              |
| **Lucide React** | 通用图标                   |
| **React Icons**  | 品牌图标                   |
| **GSAP**         | 部分动画效果               |
| **WebGPU**       | 首页 AeroShards 等视觉效果 |

网站采用文件式内容管理，主要数据来源为：

```text
content/
```

而网站逻辑主要位于：

```text
app/
components/
lib/
```

---

## 项目结构

```text
DLNU-ACM算法学习/
├── app/                    # Next.js 页面与路由
│   ├── (public)/           # 前台页面
│   └── admin/              # 管理后台
│
├── components/             # 公共 UI 组件
├── lib/                    # 内容读取、鉴权、校验、Git 等工具
├── schemas/                # 内容格式 JSON Schema
│
├── content/                # ★ 网站内容数据
│   ├── intro.json          # 工作室简介
│   ├── announcements/      # 公告
│   ├── notes/              # 算法笔记
│   ├── awards/             # 荣誉墙
│   ├── resources.json      # 资源推荐
│   ├── photos.json         # 首页照片
│   └── visualization-format/
│
├── public/                 # 静态资源
├── scripts/                # 自动化及校验脚本
│
├── ARCHITECTURE.md         # 架构设计
├── RUNNING.md              # 开发、部署与交接手册
├── CHANGELOG.md            # 版本更新记录
└── UI-设计方案.md          # UI 与交互设计
```

---

## 内容管理

项目遵循：

> **改内容 → 修改 `content/`**
> **改功能 → 修改 `app/`、`components/`、`lib/`**

例如新增一篇算法笔记：

```text
content/
└── notes/
    └── 图论/
        └── dijkstra.md
```

新增内容需要遵循对应的 Schema：

```text
schemas/
├── note.schema.json
├── announcement.schema.json
├── award.schema.json
└── intro.schema.json
```

这样可以保证不同届成员接手后，仍然能够按照统一格式维护网站。

---

## 本地运行

### 环境要求

建议安装：

* Node.js
* npm
* Git

### 安装依赖

```bash
git clone <仓库地址>
cd DLNU-ACM算法学习
npm install
```

### 启动开发环境

```bash
npm run dev
```

然后访问：

```text
http://localhost:3000
```

### 检查内容

```bash
npm run validate:content
```

### 类型检查

```bash
npm run typecheck
```

### 构建项目

```bash
npm run build
```

---

## 部署

项目部署在工作室自有服务器上。

生产环境推荐：

```text
Internet
   ↓
Caddy / Nginx
   ↓
Next.js
   ↓
content/
```

Node.js 服务可以使用 **pm2 / systemd** 进行进程守护。

详细部署流程、环境变量、服务器配置以及换届交接方式请查看：

**`RUNNING.md`**

---

## 文档

项目主要文档：

| 文档                                       | 内容                                             |
| ------------------------------------------ | ------------------------------------------------ |
| `ARCHITECTURE.md`                        | 项目整体架构、目录设计、技术选型与可持续开发规范 |
| `RUNNING.md`                             | 本地运行、后台使用、部署、Git 操作与换届交接     |
| `CHANGELOG.md`                           | v1 → v2 的版本更新记录                          |
| `UI-设计方案.md`                         | 网站 UI、页面结构、配色与交互设计                |
| `content/visualization-format/README.md` | 可视化与实验台开发规范                           |

**第一次接手项目建议阅读顺序：**

```text
README.md
   ↓
ARCHITECTURE.md
   ↓
content/ 各内容规范
   ↓
RUNNING.md
   ↓
开始开发
```

---

## 版本现状

当前版本：

**v2.0**

v2 主要完成：

* 完整管理员后台 CRUD
* Markdown 编辑器
* 图片上传
* 内容 Schema 校验
* 后台保存自动 Git 提交
* 首页三屏滚动
* ACM ParticleText 粒子效果
* 荣誉墙展示
* 资源推荐
* 首页照片轮播
* 可视化 / 实验台管理
* 完整的项目交接文档

后续版本可以继续扩展：

* 成员登录与个人主页
* 题库及做题记录
* 评论与互动
* 访问量统计
* 更细粒度的权限管理
* 实验台功能增强

---

## 开发规范

为了保证项目能够长期维护，请遵循以下原则：

1. **新增内容优先修改 `content/`，不要直接修改页面代码。**
2. **新增内容类型先定义 Schema。**
3. **尽量通过新增模块实现功能，避免破坏已有模块。**
4. **内容和代码都使用 Git 管理。**
5. **不要将 `.env.local` 等敏感配置提交到仓库。**
6. **修改后运行 `npm run typecheck` 和 `npm run build` 检查项目。**
7. **重大架构调整需要同步更新相关文档。**

---

## DLNU-ACM

本项目由 **大连民族大学 ACM 工作室**维护。

网站不仅用于展示工作室，也作为算法学习资料、比赛荣誉和可视化实验的长期载体。

> **一届建设，持续传承。**
