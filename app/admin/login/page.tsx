"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/admin/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "登录失败");
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto" }}>
      <h1>管理员登录</h1>
      <form onSubmit={onLogin} className="card" style={{ marginTop: 20 }}>
        <div className="field">
          <label>管理员密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {msg && <div className="notice err">{msg}</div>}
        <button className="btn" type="submit" style={{ width: "100%" }}>
          登录
        </button>
      </form>
    </div>
  );
}
