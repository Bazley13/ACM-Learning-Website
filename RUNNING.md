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
├── content/              # ★ 内容即资产：唯一数据源
│   ├── intro.json        #   工作室简介
│   ├── announcements/    #   公告
│   ├── notes/            #   算法笔记
│   ├── awards/           #   荣誉墙证书
│   └── visualization-format/  # 可视化/实验台（含其 README）
├── schemas/              # 内容格式的 JSON Schema
├── src/                  # 代码层（与 content 解耦）
├── scripts/              # 运维脚本
└── (部署相关)            # 见第 5 节
```

**铁律**：改内容 = 改 `content/` 下的文件；改功能 = 动 `src/` 并尽量新增模块，**不要改跨层的对外格式**（详见 ARCHITECTURE.md 第 7 节）。

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

## 3. 后台（/admin）

- 后台和前台在**同一个服务**里，路径 `/admin`，需登录。
- 后台上传的本质 = **把输入写成合规的 `content/` 文件**并自动做 schema 校验 + 自动 Git 提交。
- 权限：首版单一管理员账号；后续可按 `ARCHITECTURE.md` 扩展为管理员/成员两级。
- 实验台上传走完整安全流程（ZIP 解压 → manifest 校验 → 文件限制与扫描 → 静态托管），拒不合法输入。

---

## 4. 内容格式的规范中心

所有内容格式的"标准答案"在 `schemas/` 与 `visualization-format/`：

| 内容 | Schema / 规范 |
|------|--------------|
| 笔记 | `schemas/note.schema.json` |
| 公告 | `schemas/announcement.schema.json` |
| 荣誉墙证书 | `schemas/award.schema.json` |
| 工作室简介 | `schemas/intro.schema.json` |
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
