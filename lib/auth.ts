// 极简后台鉴权：单一管理员 + HMAC 签名的 session cookie。
// 不依赖数据库，靠环境变量 ADMIN_PASSWORD + SESSION_SECRET。
// 首版单一管理员；后续可在此扩展为多用户/角色（见 ARCHITECTURE.md）。

import crypto from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // TODO: 部署时用环境变量覆盖
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

export function sign(value: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("hex");
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  // payload = 过期时间戳，签名为 HMAC
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 天
  const payload = EXPIRED_MARKER + exp;
  return payload + "." + sign(payload);
}

const EXPIRED_MARKER = "acmsession";

export function validateSessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const payload = parts[0];
  const sig = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(parts[1]))) return false;
  if (!payload.startsWith(EXPIRED_MARKER)) return false;
  const exp = Number(payload.slice(EXPIRED_MARKER.length));
  return Number.isFinite(exp) && exp > Date.now();
}

export const SESSION_COOKIE = "acm_session";
export const EXPIRES_AT = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
