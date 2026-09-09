# 实验台运行契约 (Host/App Interface) v1.0

> 本契约规定了网站（Host）如何把一个实验台小程序装进沙箱、如何把参数传进去、小程序如何回报结果。小程序**内部实现完全自由**，只需遵守这薄薄一层接口即可被网站识别与驱动。

---

## 1. 运行环境

小程序在**沙箱 iframe** 中加载，入口即 manifest 里的 `entry`（如 `index.html`）。

沙箱属性（安全边界，不可放宽）：

```
sandbox="allow-scripts"
```

**不启用** `allow-same-origin`、`allow-top-navigation`、`allow-forms`、`allow-popups`。

因此小程序里：
- ❌ 拿不到父页面的 cookie / localStorage / 后台 session / 服务器文件。
- ❌ 不能用 `fetch()` 访问站内 API（除非明确走下面第三节白名单）。
- ✅ 可以用自己的独立 `window` / `document`，自由写动画、Canvas、DOM、加载自己的 JS/CSS。

---

## 2. Host 数据注入：`window.__LAB__`

网站向小程序注入一个全局对象 `window.__LAB__`（版本 v1.0）。小程序在 `DOMContentLoaded` 时读取即可。

```js
window.__LAB__ = {
  manifestId,          // 这个实验台的 id
  hostApiVersion: "1.0",

  // 参数
  getParam(name),      // 取当前参数 name 的值（首帧参数）

  // 状态控制回调注册
  onRun(fn),           // 网站点『运行』时触发 fn()
  onReset(fn),         // 网站点『重置』时触发 fn()

  // 回报结果（可选）
  report(result)       // 把本次运行输出回报给网站展示，result 为任意 JSON
};
```

**约定**：
- 小程序**必须**在 DOM 加载后调用 `onRun(fn)` / `onReset(fn)` 注册自己的逻辑，否则网站点按钮后它毫无反应。
- 参数通过 `getParam(name)` 读取；参数在每次运行前都已就位，不需要小程序自己轮询。
- `report()` 回报的数据由网站统一展示在"运行输出"区域，便于不同小程序都有统一的结果区。

---

## 3. 参数传递与更新

- **首帧**：站点加载 iframe 前，把 manifest 里 `params` 的默认值打包注入 `__LAB__`。
- **每次『运行』前**：网站把当前面板的最新参数通过 `__LAB__` 刷新，再触发 `onRun`。
- 参数面板由网站按 manifest 的 `params` 类型统一渲染（数字/整数/文本/下拉/勾选/滑块/取色），所有小程序长一致的交互。

---

## 4. 样例 (samples)

manifest 的 `samples` 里每条 = 一组预置参数。网站渲染"一键填入样例"按钮：点击后把该样例的 `params` 填进面板，可立即运行。作者可借此提供多种有讲解价值的预设（如不同初值、不同算法）。

---

## 5. 可选的向外通信（后补扩展位，v1.0 默认关闭）

出于安全，对外网络能力默认关闭。如未来确实需要（例如从服务器取题/取图），**必须**：
1. 后端加一个**白名单代理端点**，只转发允许的站点/路径；
2. manifest 里加白名单声明（新增字段，见 v1.x 扩展）。
这条默认不做，避免成为脚本注入通道。

---

## 6. 给内容作者的最小可用模板（第二档 demo）

```html
<!DOCTYPE html>
<html lang="zh">
<body>
  <canvas id="c"></canvas>
  <script>
    // 1) 注册控制回调
    window.__LAB__.onRun(() => {
      const a = window.__LAB__.getParam('a');
      const mode = window.__LAB__.getParam('mode');
      runFrames(a, mode);          // 2) 你的算法表现逻辑（完全自由）
    });
    window.__LAB__.onReset(() => { resetCanvas(); });

    // 3) 回报结果（可选）
    // window.__LAB__.report({ value: x, iterations: n });
  </script>
</body>
</html>
```

---

## 7. 契约演进保证

- 契约版本号在 manifest `minHostApi` 与 `__LAB__.hostApiVersion` 两处声明，**向后兼容**：老实验台在新网站上照跑；新增能力用新版本号声明，不影响存量。
- 契约本身只增不减，这是"一届传一届"的关键——下一届加功能不必改旧实验台。
