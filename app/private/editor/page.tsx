"use client";
import { useState } from "react";

export default function Editor() {
  const [message, setMessage] = useState("");

  const pages = ["about", "hobbies", "projects", "gallery", "blog"];

  return (
    <main className="page">
      <a href="/private" className="back-link">Back to Private</a>
      <h1>Page Editor</h1>
      <p className="muted">Choose a page and update its content. (Database integration coming soon!)</p>
      <div className="editor-pages">
        {pages.map(p => (
          <div key={p} className="editor-card">
            <strong>{p.charAt(0).toUpperCase() + p.slice(1)}</strong>
            <p>Edit the {p} page content here</p>
            <textarea placeholder={"Write your " + p + " content..."} rows={4} />
            <button>Save</button>
          </div>
        ))}
      </div>
      {message && <p className="editor-message">{message}</p>}
    </main>
  );
}
