# CHANGELOG — DLNU·ACM 工作室官网

本文件记录历届交接时的版本里程碑。约定：版本号写在 `package.json`，与文档（ARCHITECTURE / RUNNING / UI-设计方案）保持一致。

---

## v2.0（第 2 版，本次收尾）

> 交接主线：这一版把「内容即文件 + 后台自动写文件 + 自动 Git 提交」做成了完整可用闭环，并定稿了首页观感。

### 后台（/admin）——从"内容即文件"扩展为完整 CRUD
- **公告**：发布 / 查看已发布 / 编辑（覆盖）/ 删除，列表每条一张卡片。
- **简介**：修复「无法提交」（`intro.schema.json` 的 `contests[].type` 由固定枚举放宽为任意字符串）；正文接入内置 Markdown 编辑器。
- **荣誉墙**：查看记录 / 编辑（回填保留原图）/ 删除，列表卡片化。
- **笔记**：内置 Markdown 编辑器 / 查看 / 编辑 / 删除；难度统一为 入门/进阶/登峰（修正了残留的「竞赛」选项导致校验失败的 bug）。
- **资源推荐**：友好表单式编辑（分类卡片 + 条目表单：名称/链接/图标下拉/简介，增删分类与条目），不再手写 JSON。洛谷/牛客等品牌图标保留。
- **可视化 / 实验台**：列出已上传，编辑（简易档回填 JSON 重提交覆盖）、删除；实验台可删除。
- **首页照片轮播**：`/admin/photos` 后台可编辑——上传图片（落盘 `/uploads/`）/填路径 / 改标题·说明·emoji·渐变色，增删条目。
- **图片上传接口** `/admin/api/upload`（仅管理员），内置编辑器「插入图片」按钮自动插入 `![](url)`。
- **编辑框可手动拖右下角改大小** 的 bug 全局修复（`resize:none`）。

### 编辑器更换（文字可见性 bug 根治）
- 原 `@uiw/react-md-editor` 的打包 CSS 在站点上未生效，导致编辑框内"字体色＝底色、看不见字"。
- 已换为**自包含 Markdown 编辑器**（`components/admin/MdEditorField.tsx`）：工具条（标题/粗体/斜体/链接/列表/引用/代码/分隔线/插入图片）+ 白底深字的 textarea + `marked` 实时预览。
- 「查看」预览同步换为本地的 `MDPreview`（`components/admin/MDPreview.tsx`，也用 `marked`），公告/笔记查看卡片同样保证可见。
- `@uiw/*` 依赖仍留在 package.json（历史），已不再被引用（可择机移除）。

### 首页（第 2 版观感定稿）
- **三屏纵向滚动吸附**（`.home-slides` scroll-snap）：屏1 深色 Hero（WebGPU 可用则 AeroShards 光栅，否则渐变兜底）→ 屏2 简介+公告 → 屏3 「ACM + 比赛·日常照片轮播」。
- **页面切换立体卡片翻页感**：`Slide3D`（IntersectionObserver）+ CSS `perspective/rotateX`，命中屏回正、其余后仰压暗。
- **屏3 左侧“ACM”改 ParticleText 粒子效果**（忠实移植自 reactbits.dev，已在 `resource/ParticleText.md`）：粒子散射→聚合成“ACM”，辉光 + 缓慢漂浮 + 鼠标推开。参数已调为 尺寸2、`density 7`（匀称稀疏）、主色 `#e8edf5`（亮度压低）。
- **屏2/屏3 背景**：改为**蓝·黄·红三色动效背景**（`triBgDrift` 动画，三团径向光斑缓慢漂移），底色提亮不再死黑；`prefers-reduced-motion` 下自动停用动画。
- 顶部导航 `SiteNav` 全局 solid sticky（不再用 CardNav/NavShell 下拉），左上角 ICPC logo。
- 左上方「工作室理念」导航项的入口已移除。

### 其他
- 依赖：`lucide-react` / `react-icons` / `gsap` / `vgpu` / `marked` 等。
- 构建验收：`npm run typecheck` 与 `npm run build` 均通过（exit 0）。

---

## v1（首版，招新前的可用骨架）

- 技术栈：Next.js 14 (App Router) + TypeScript（strict）+ `content/` 文件式内容。
- 四大功能最小闭环：简介、笔记（分类/搜索/详情）、公告（置顶/过期）、荣誉墙、可视化双档 + 实验台沙箱。
- 单管理员后台（鉴权 + 写内容自动 Git 提交）。
- 站点：首页深色 Hero，ICPC 红黄蓝配色、蓝色主调。

> 本文档从 v2.0 开始维护；v1 细节以 Git 历史与既有文档为准。
