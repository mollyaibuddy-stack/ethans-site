"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Private() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "config-error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (sessionStorage.getItem("ethan-private-tab-session") !== "active") {
        return;
      }

      const response = await fetch("/api/private/session");
      const data = await response.json().catch(() => null);
      if (!cancelled && response.ok && data?.authenticated) {
        setStatus("success");
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/private/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (response.ok) {
      sessionStorage.setItem("ethan-private-tab-session", "active");
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/private/")) {
        router.push(next);
        return;
      }
      setStatus("success");
      return;
    }

    setStatus(response.status === 503 ? "config-error" : "error");
    setPin("");
  };

  const goHome = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    sessionStorage.removeItem("ethan-private-tab-session");
    await fetch("/api/private/logout", { method: "POST" }).catch(() => null);
    router.push("/");
  };

  if (status === "success") {
    return (
      <main className="page private-area">
        <h1>Private Area</h1>
        <div className="private-links">
          <a href="/private/money" className="card-link">Money Tracker</a>
          <a href="/private/checklist" className="card-link">Daily Checklist</a>
          <a href="/private/editor" className="card-link">Page Editor</a>
        </div>
        <a href="/" className="back-button pin-home-button" onClick={goHome}>Back to home</a>
      </main>
    );
  }

  return (
    <main className="page pin-page">
      <h1>Private Area</h1>
      <p className="muted">Enter your PIN to continue</p>
      <form onSubmit={handleSubmit} className="pin-form">
        <input
          ref={inputRef}
          type="password"
          maxLength={4}
          inputMode="numeric"
          pattern="[0-9]{4}"
          placeholder="...."
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="pin-input"
          autoFocus
        />
        <button type="submit" disabled={pin.length !== 4 || status === "loading"}>
          {status === "loading" ? "..." : "Enter"}
        </button>
        {status === "error" && <p className="error">Wrong PIN, try again</p>}
        {status === "config-error" && <p className="error">Private login is not configured on the server.</p>}
      </form>
      <a href="/" className="back-button pin-home-button" onClick={goHome}>Back to home</a>
    </main>
  );
}
