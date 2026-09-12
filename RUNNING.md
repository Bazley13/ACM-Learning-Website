# DLNU-ACM 工作室官网 · 交接手册（RUNNING.md）

> 这是给**每一届接手的成员**看的。看懂这篇，你就能把这个网站跑起来、加内容、加功能、部署上线，并在下一届换届时把它交接下去。
> 配套必读：`ARCHITECTURE.md`（架构总纲，讲为什么这么设计）。

---

## 0. 快读：接手三步

1. **拉仓库**：`git clone <repo-url> && cd DLNU-ACM算法学习`
2. **装依赖并跑起来**：`npm install && npm run dev` → 打开 http://localhost:3000
3. **读规范**：`ARCHITECTURE.md` + `content/` 各格式（含 `visualization-format/README.md`）

---

## 1. 项目结构速览

```
DLNU-ACM算法学习/
├── ARCHITECTURE.md       # 架构总纲（必须读）
├── RUNNING.md            # 本文档（交接手册）
├── CHANGELOG.md          # 版本里程碑（v1 → v2）
├── UI-设计方案.md        # 界面/交互设计蓝图（v2 已对齐实现）
├── app/                  # ★ 代码层：Next.js 路由（含 /admin）
│   ├── (public)/         #   前台页面
│   └── admin/            #   后台 + /admin/api/* 写文件接口
├── components/           # 复用组件（SiteNav/Slide3D/ParticleText/MD 组件等）
├── lib/                  # 工具：鉴权、schema 校验、git、content loader
├── content/              # ★ 内容即资产：唯一数据源
│   ├── intro.json        #   工作室简介
│   ├── announcements/    #   公告（*.md）
│   ├── notes/            #   算法笔记（<分类>/<slug>.md）
│   ├── awards/           #   荣誉墙（id.json + images/）
│   ├── resources.json    #   资源推荐（洛谷/牛客等）
│   ├── photos.json       #   首页照片轮播（比赛·日常）
│   └── visualization-format/  # 可视化/实验台（含其 README）
├── schemas/              # 内容格式的 JSON Schema
├── scripts/              # 运维脚本（validate-content 等）
├── public/               # 静态资产（含后台 /uploads/ 上传图、证书图）
└── (部署相关)            # 见第 5 节
```

**铁律**：改内容 = 改 `content/` 下的文件；改功能 = 动 `app/`（页面/路由）并尽量新增模块，**不要改跨层的对外格式**（详见 ARCHITECTURE.md 第 7 节）。

---

## 2. 常见任务（给内容管理员/普通成员）

### 发一则公告
1. 在 `content/announcements/` 新建 `YYYY-MM-DD-<slug>.md`。
2. 顶部 YAML 参考 `content/announcements/招新公告.md`，字段见 `schemas/announcement.schema.json`（`type` 必须取枚举之一）。
3. 提交并上线即可；`pinned: true` 会置顶，`expires` 可设自动过期。

### 写一篇算法笔记
1. 在 `content/notes/<专题>/` 新建 `<slug>.md`。
2. YAML 参考 `content/notes/基础算法/冒泡排序.md`，字段见 `schemas/note.schema.json`。
3. 可以填 `visualizationId` 把笔记串到一个实验台/可视化。

### 上传一张获奖证书
1. 证书图片放 `content/awards/images/`。
2. 在 `content/awards/` 新建 `<id>.json`，参考 `2024-icpc-bronze.json`，字段见 `schemas/award.schema.json`。
3. `competition` 尽量用统一主办方名（ICPC/CCPC/码蹄杯/蓝桥杯/百度之星/PTA团体/辽宁省赛），便于荣誉墙按比赛筛选。

### 改工作室简介
- 直接改 `content/intro.json`，字段见 `schemas/intro.schema.json`。

### 新增一个可视化 / 实验台
→ 见 `content/visualization-format/README.md`（它单独成册，两档模型 + 检查清单都在里面）。

---

## 3. 后台（/admin）——完整 CRUD（v2）

- 后台和前台在**同一个服务**里，路径 `/admin`，需登录（单一管理员账号）。
- 后台一切“编辑/发布/删除”的本质 = **把输入写成合规的 `content/` 文件**，自动做 schema 校验 + **自动 Git 提交**（`lib/git.ts`）；你不用手动 commit。
- 后台各页（导航栏可切换）：
  | 页面 | 路由 | 能力 |
  |------|------|------|
  | 概览 / 登录 / 退出 | `/admin` `/admin/login` `/admin/logout` | 统计与鉴权 |
  | 笔记 | `/admin/notes` | 内置 Markdown 编辑器 + 查看/编辑/删除 + zip 成包上传 |
  | 公告 | `/admin/announcements` | 发布/查看已发布/编辑/删除 |
  | 荣誉墙 | `/admin/awards` | 查看记录/编辑(保留原图)/删除 + 上传证书 |
  | 简介 | `/admin/intro` | 简介提交（已修 schema，任意比赛名可存）+ Markdown 正文 |
  | 可视化/实验台 | `/admin/visualization` | 简易演示上传/编辑/删除 + 实验台 ZIP 上传/查看/删除 |
  | 资源推荐 | `/admin/resources` | 友好表单式编辑（洛谷/牛客等，不再是手写 JSON） |
  | 照片轮播 | `/admin/photos` | 首页第三屏照片编辑 + 上传图片 |
  | 笔记反馈 | `/admin/feedback` | 反馈查看/删除 |
- **内置 Markdown 编辑器**：v2 换了自包含实现（`components/admin/MdEditorField.tsx`，工具条 + `marked` 实时预览 + “插入图片”）。
  → 之前 `@uiw/react-md-editor` 在站点上打包 CSS 未生效导致“编辑框字看不见”，v2 已根治；“查看”预览同步换本地 `MDPreview`。
- **图片上传**：`/admin/api/upload`（仅管理员）落盘 `public/uploads/`，编辑器“插入图片”自动填 `![alt](/uploads/…)`。
- 实验台上传走完整安全流程（ZIP 解压 → manifest 校验 → 文件限制与扫描 → 静态托管），拒不合法输入。
- **内容校验脚本**：`npm run validate:content`（scripts/validate-content.ts）可离线核对 content 是否全部合规，写内容前建议跑一遍。

---

## 4. 内容格式的规范中心

所有内容格式的"标准答案"在 `schemas/` 与 `visualization-format/`：

| 内容 | Schema / 规范 |
|------|--------------|
| 笔记 | `schemas/note.schema.json` |
| 公告 | `schemas/announcement.schema.json` |
| 荣誉墙证书 | `schemas/award.schema.json` |
| 工作室简介 | `schemas/intro.schema.json` |
| 资源推荐 | `content/resources.json`（结构式，无独立 schema；后端要求 `categories` 为数组） |
| 首页照片轮播 | `content/photos.json`（结构式，无独立 schema；后端要求 `photos` 为数组） |
| 简易可视化 | `visualization-format/visualization.schema.json` |
| 实验台小程序 | `visualization-format/app-manifest.schema.json` + `RUN-CONTRACT.md` |

> 新增一种内容类型时：**先写 schema，再建目录，再让后台/页面去读它**。schema 是"格式即规范"，别绕过。

---

## 5. 部署到服务器（交接必备）

**前置**：自有服务器 + 已装 Node.js / pm2（或 systemd）+ Web 服务器（推荐 Caddy，自动 HTTPS）。

推荐流程：

```bash
# 1) 服务器拉仓库
git clone <repo> /srv/dlmu-acm && cd /srv/dlmu-acm

# 2) 装依赖并构建
npm ci && npm run build

# 3) 用 pm2 常驻（崩了自动拉起）
npm i -g pm2
pm2 start "npm run start" --name dlmu-acm
pm2 save && pm2 startup   # 重启机器后自动拉起

# 4) Caddy 反向代理 + 自动 HTTPS
#    Caddyfile:
#    acm.example.edu.cn {
#        reverse_proxy 127.0.0.1:3000
#    }
```

生产环境用**后台自动 Git 提交**接收内容更新（`git pull` 到服务器），或配置 webhook 触发重建。

> 运维铁律：把域名、证书在哪配、端口、账号**写进本文档/服务器 README**，别只装在个人脑子里——这是"换人不挂"的关键。

---

## 6. 换届交接清单

离任前，把下面这些交接给下届：

- [ ] 仓库地址、服务器 SSH/域名、Caddy 或 Nginx 配置位置
- [ ] 管理员账号 / 环境变量
- [ ] 内容格式规范有没有新增部分（若新增了，schema 和文档要同步）
- [ ] 实验台小程序"契约版本"是否仍向后兼容
- [ ] 本手册 `RUNNING.md` 和 `ARCHITECTURE.md` 是否有需要更新的地方
- [ ] 交接一次"跑起来 + 加一条内容 + 部署上线"的演示

---

## 7. 常见错误速查

| 表现 | 原因/解决 |
|------|-----------|
| 内容不显示 | front-matter 字段拼错 / 不满足 schema；用后台上传会自动校验，手写则对照 schema |
| 实验台白屏/按钮无反应 | 没注册 `__LAB__.onRun/onReset`；详见 `RUNNING-CONTRACT.md`（即 `visualization-format/RUN-CONTRACT.md`） |
| 服务连不上 | pm2 是否 running；端口 3000 / 443 是否被 Caddy 正确转发 |
| 编码乱码 | 文件必须 UTF-8；Windows 下读取务必指定 `-Encoding UTF8` |

---

## 8. Git 日常命令速查（交接必会）

> "内容即文件、可交接"的载体就是 Git。每一届接手第一件事：`git clone` 把仓库拉下来 → 内容与代码全在手上。日常改动习惯性 commit + push，留历史、可回滚。

### 8.1 首次初始化 + 第一次提交

```powershell
cd "D:\大连民族大学\ACM工作室\DLNU-ACM算法学习"
git init                                # 1. 初始化仓库
git config user.name "你的GitHub用户名"  # 2. 配身份（当前仓库，不带 --global）
git config user.email "你的GitHub注册邮箱"
git add .                               # 3. 加入暂存区
git status                              # 4. （可选）查看待提交内容
git commit -m "初始提交：ACM工作室官网第一版"  # 5. 第一次提交
```

### 8.2 推送到 GitHub

**路线 A（推荐，VSCode GUI，自动建远端仓库）：**
1. 在 VSCode 打开本项目 → `Ctrl + Shift + G` 打开源代码管理。
2. 点顶部的 **「发布到 GitHub」**。
3. 选仓库名；**建议勾选 Private（私有）**。
4. 完成后自动推送，得到远端仓库链接。

**路线 B（命令行，可精确控制仓库归属）：**
1. 浏览器 GitHub → `+` → New repository → 填名 → **勾 Private** → **别勾** README/.gitignore/license → Create。
2. 终端连接并推送：
```powershell
git remote add origin https://github.com/<用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 8.3 日常"改一点，存一点"（每天都要用）

```powershell
git add .                       # 暂存所有改动
git commit -m "说明这次改了什么"   # 本地提交
git push                        # 推到 GitHub
```

> 对应 VSCode GUI：源代码管理面板 → 文件点 `+` 暂存 → 顶部输提交信息 → ✓ 提交 → `...` → 推送。

### 8.4 接手别人 / 下一届的代码

```powershell
git clone <仓库URL> <本地目录名>
cd <本地目录名>
npm install
npm run dev
```

### 8.5 回滚（改坏了不怕）

```powershell
git log --oneline            # 查看提交历史
git revert <commit哈希>       # 撤销某次提交（保留历史，推荐）
# 或：git reset --hard <commit哈希>   # 彻底回退到某次（慎用，会丢之后的改动）
```

### 8.6 常见坑速查

| 情况 | 处理 |
|------|------|
| "Please tell me who you are" | 没配身份，重跑 8.1 第 2、3 步 |
| "src refspec main does not match any" | 还没提交；先 commit 再 push |
| "remote origin already exists" | 先 `git remote remove origin` 再重来 |
| push 要密码但账号密码不行 | 用 **Personal Access Token**（GitHub 已停用密码 push） |
| 想撤销 git init | 删隐藏目录 `.git`：`rmdir /s .git` |

### 8.7 交接时给下一届的 Git 提示

- 先 `git clone` **再** `npm install`，不要反着来。
- 内容改动（笔记/公告/证书/可视化）也走 commit，它是有版本的内容资产。
- 服务器部署用同一仓库的不同副本：服务器 `git pull` 拉最新 → 重建/重启（见第 5 节）。
- 环境变量（管理员密码等）永远不要 commit 进仓库，用 `.env.local`（已在 `.gitignore` 排除）。

## 交接补充（v2：首页观感 + 动画组件 + 许可提示）

第三方依赖 / 组件，交接时请注意：

- 依赖：`gsap`（部分 ReactBits 动画，免费版许可）、`vgpu`（AeroShards 的 WebGPU 光栅库）、`marked`（Markdown 渲染）、`lucide-react` / `react-icons`（图标）。均已写入 package.json。
- `components/AeroShardsCanvas.tsx`：忠实移植 reactbits.dev 的 AeroShards（`resource/AeroShards.md`）；**依赖浏览器 WebGPU**。特性检测：`navigator.gpu` 可用才渲染首屏光栅，否则保留深色渐变兜底——任何环境不黑屏。
- `components/Slide3D.tsx`：首页三屏（`.home-slides` scroll-snap）的**立体卡片翻页感**（IntersectionObserver 命中屏回正、其余后仰压暗）。
- `components/ParticleText.tsx`：忠实移植 reactbits.dev 的 ParticleText（`resource/ParticleText.md`），用于首页第三屏左侧 **“ACM” 粒子字样**（粒子聚合成型、辉光 + 缓慢漂浮 + 鼠标推开）。密度/亮度参数已在 page.tsx 调为既定观感。
- 全局导航为 `components/SiteNav.tsx`（solid 顶部栏，滚动隐藏），左上 `IcpcLogo`；不再是 CardNav 下拉。
- 第二、第三屏背景为**蓝·黄·红三色动效光斑**（`globals.css` 的 `@keyframes`，`prefers-reduced-motion` 自动停用）。
- 首页第三屏右侧照片轮播可在 `/admin/photos` 后台编辑（数据源 `content/photos.json`）。
- ⚠ ReactBits 组件为开源（MIT 类许可，已确认可用），但 AeroShards 需 WebGPU、较重量，正式发布前请在真实 GPU 浏览器跑通一次首屏。

构建：`npm run typecheck && npm run build`。
