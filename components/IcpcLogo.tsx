/**
 * IcpcLogo —— 左上角图标（ICPc 三色环标记，inline SVG）。
 * 三环用 ICPc 经典红/黄/蓝：蓝 #3b82f6、红 #ef4444、黄 #f59e0b（呼应站点配色）。
 * 占位标识，如后续有官方 logo 图片可替换为该 SVG 或 <img>。
 */
export default function IcpcLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="ICPC 标识"
    >
      {/* 底色圆形 */}
      <circle cx="32" cy="32" r="30" fill="#0d1730" />
      {/* 三色环 */}
      <path
        d="M32 6 a26 26 0 0 1 22.5 13 l-6 3.4 a20 20 0 0 0 -16.5 -10.4 z"
        fill="#3b82f6"
      />
      <path
        d="M54.5 19 a26 26 0 0 1 0 26 l-6 -3 a20 20 0 0 0 0 -20 z"
        fill="#ef4444"
      />
      <path
        d="M54.5 45 a26 26 0 0 1 -22.5 13 l1.7 -6.8 a20 20 0 0 0 15 -10 z"
        fill="#f59e0b"
      />
      {/* 中心圆点 */}
      <circle cx="32" cy="32" r="8" fill="#fff" />
    </svg>
  );
}
