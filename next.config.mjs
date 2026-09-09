/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 说明：不使用 output: "standalone"，改用标准的 `next build && next start`。
  // standalone 会与 next start 冲突（需自行指定 node .next/standalone/server.js），
  // 对交接更复杂，此处省略。部署用 `next start` 即可（见 RUNNING.md）。
};

export default nextConfig;
