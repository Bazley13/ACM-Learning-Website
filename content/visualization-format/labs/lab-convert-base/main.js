// 实验台小程序内部实现 —— 完全自由。
// 只需遵守 RUN-CONTRACT.md 的 window.__LAB__ 接口（hostApi 自动注入）。
// 本示例：进制转换短除法，展示 __LAB__.getParam / onRun / onReset / report。

var runFns = [];

window.__LAB__.onRun(function () {
  var value = parseInt(window.__LAB__.getParam("value"), 10);
  var base = parseInt(window.__LAB__.getParam("base"), 10);
  render(value, base);
});

window.__LAB__.onReset(function () {
  document.getElementById("steps").innerHTML = "";
});

// 展示每一步长除法：value / base 的商与余数
function render(value, base) {
  var box = document.getElementById("steps");
  var rows = [];
  var n = value;
  while (n >= base) {
    rows.push({ dividend: n, quotient: Math.floor(n / base), remainder: n % base });
    n = Math.floor(n / base);
  }
  rows.push({ dividend: n, quotient: 0, remainder: n });
  rows.reverse();

  var html = "<ol>";
  rows.forEach(function (r, i) {
    html +=
      "<li><code>" +
      r.dividend +
      " ÷ " +
      base +
      " = " +
      r.quotient +
      " 余 " +
      r.remainder +
      "</code>" +
      (i === rows.length - 1 ? " <b>（最高位）</b>" : "") +
      "</li>";
  });
  var result = rows.map(function (r) { return r.remainder; }).join("");
  html += "</ol>";
  html += "<p>结果（base " + base + "）：<strong>" + result + "</strong></p>";
  box.innerHTML = html;

  window.__LAB__.report({ decimal: value, base: base, result: result, steps: rows.length });
}
