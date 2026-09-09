# ACM 工作室 · 算法可视化与实验台规范 v1.0

> 工作室的**交接资产**：新一届照着这里就能新增可视化 / 实验台，且不必改动已有内容。
> 本目录下三份规范共同定义"一个可以被网站识别并运行的可视化/实验台"到底长什么样。

---

## 0. 总纲：两档并存

可视化功能分两档，按门槛与自由度递进：

| 档位 | 名称 | 数据形态 | 门槛 | 自由度 | 适合 |
|------|------|----------|------|--------|------|
| 第一档 | **简易演示** | 一个 JSON 步骤帧文件 | 零代码，纯写 JSON | 低（受帧模型约束） | 排序/简单查找等入门动画 |
| 第二档 | **实验台小程序** | 一个 ZIP（manifest + 入口 + 资源） | 会一点 JS（可借助 AI） | 高（内部完全自由） | 复杂算法、可调参、可填样例的交互小应用 |

对应文件：
- **简易档** → `visualization.schema.json`（步骤帧格式）+ `examples/bubble-sort.json`、`examples/binary-search.json`
- **实验台档** → `app-manifest.schema.json`（清单）+ `RUN-CONTRACT.md`（运行契约）+ `examples/manifest.sample.json`

目录建议约定：

```
content/
  visualizations/           # 简易档：id.json -> /visualization/<id>
    bubble-sort.json
  labs/                     # 实验台档：<id>/（ZIP 解压）-> /lab/<id>
    lab-sqrt-converge/
      manifest.json
      index.html
      main.js
      style.css
```

> **命名铁律**：简易档文件名 = 文件内 `id`；实验台目录名 = manifest 的 `id`。

---

## 1. 简易档：声明式步骤帧（visualization.schema.json）

一个可视化 = 一个 JSON 文件。作者只描述每帧做什么（高亮/指针/取值/交换/讲解），渲染器播放，**不写渲染代码**。

关键设计：
- **安全**：结构化数据，非可执行代码，无注入风险。
- **好校验**：后台用 JSON Schema 实时校验。
- **type 可插拔、数据稳定**：v1.0 只开 `array`；`linked-list/tree/graph/board` 保留待扩展，扩展**不改已有内容文件**。
- **语义色令牌**代替具体色值，换主题/深色模式无痛。

语义色令牌与帧模型字段详见 schema 注释与旧 README 保留内容（帧、pointers 快照、data 只读基线等约定不变）。

---

## 2. 实验台档：小程序清单 + 运行契约

这是本规范的核心，面向"复杂算法、可调参、可填样例"的高自由度场景。

- **app-manifest.schema.json**：定义小程序"是什么、打包了哪些文件、有哪些可调参数、有哪些预置样例"。只做**接口契约**，不约束内部实现。参数面板由网站按 manifest 统一渲染。
- **RUN-CONTRACT.md**：网站如何装进沙箱、如何注入参数（`__LAB__`）、如何驱动运行/重置、小程序如何回报结果。

### 安全边界（已确认，不可放宽）
- 小程序跑在 `sandbox="allow-scripts"` 沙箱 iframe（**不**开 `allow-same-origin` 等）。
- **仅管理员**可上传。
- 上传做文件类型/大小/数量限制 + 恶意特征扫描。
- 后端仅**静态托管**，不做任何服务端执行。

> 底线认识：沙箱挡住"偷数据和破坏服务器"，但挡不住"恶意脚本在访客浏览器里搞事"。所以前提是**信任管理员不传坏东西**。这在工作室场景合理，但要把这条写进运维手册，别让权限散落到非管理员。

---

## 3. 给下一届的"如何新增"指南

### 新增一个简易演示
1. 从 `examples/` 复制最接近的示例。
2. 改 `id`/`title`/`data`，按算法补充 `steps`。
3. 用 Schema 校验后放进 `content/visualizations/`，提交即上线。

### 新增一个实验台小程序
1. 写 `index.html`（含 UI 与算法逻辑，可借助 AI），遵守 `RUN-CONTRACT.md` 的 `__LAB__` 接口。
2. 写 `manifest.json`（参照 `examples/manifest.sample.json`），声明 `params` 与 `samples`。
3. 把 manifest + 资源打成一个 ZIP，进后台上传 → 自动解压、校验清单、静态托管。
4. 访问 `/lab/<id>` 验证参数面板与运行按钮。

### 检查清单（实验台上传后台自动跑）
- [ ] manifest 通过 `app-manifest.schema.json` 校验
- [ ] `entry` 指向 ZIP 内真实存在的 HTML
- [ ] `files` 列表里的路径都存在于 ZIP
- [ ] 文件类型/大小/数量在允许范围内
- [ ] 恶意特征扫描无命中
- [ ] 解压后无路径穿越（文件名不得含 `..` / 绝对路径）

---

## 4. 契约演进保证（一届传一届的关键）

- 契约版本号在 manifest `minHostApi` 与 `__LAB__.hostApiVersion` 两处声明，**向后兼容**：老实验台在新站照跑。
- 契约**只增不减**；新增能力用新版本号声明，不动存量。
- 简易档的 type 是可插拔的；实验台档的 manifest 是稳定的。两条都保证"上一届内容 = 下一届资产"。

---

## 5. 待你后续确认

- 简易档 `visualization.schema.json` 里的"一帧单操作 vs 多操作""config 是否明文枚举"——沿用已写定的宽松基调。
- 实验台对外网络能力默认关闭，若未来要"从服务器取题/取图"，需新增白名单代理 + manifest 白名单字段（记录在 `RUN-CONTRACT.md` 第 5 节），默认不做。

---

## 6. 校验命令（本地，注意用 UTF-8 读取验证）

```bash
# 简易档
npx ajv-cli validate -s visualization.schema.json -d "examples/*.json" --spec=draft7
# 实验台档
npx ajv-cli validate -s app-manifest.schema.json -d "examples/manifest.sample.json" --spec=draft7
```

> 备注：本工作区沙箱不允许写入 npm 全局缓存，故 `npx` 在此环境跑不了；在校外/部署机可正常执行。文件本身编码为 UTF-8，读时务必用 UTF-8（Get-Content -Encoding UTF8），否则中文字节会被误读报错。
