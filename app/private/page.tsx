"use client";
import { useState, useRef } from "react";

export default function Private() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const correctPin = "1234"; // Will be moved to env var

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      if (pin === correctPin) {
        setStatus("success");
      } else {
        setStatus("error");
        setPin("");
      }
    }, 500);
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
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="pin-input"
          autoFocus
        />
        <button type="submit" disabled={pin.length !== 4 || status === "loading"}>
          {status === "loading" ? "..." : "Enter"}
        </button>
        {status === "error" && <p className="error">Wrong PIN, try again</p>}
      </form>
      <a href="/" className="back-link">Back to home</a>
    </main>
  );
}
