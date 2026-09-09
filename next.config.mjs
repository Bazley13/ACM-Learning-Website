/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // content/ 是运行态内容源，编译时不需要静态导出，保持标准 node output
  output: "standalone",
};

export default nextConfig;
