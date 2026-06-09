"use client";

import { useEffect, useState } from "react";

export default function Editor() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingPage, setSavingPage] = useState("");

  const pages = ["about", "hobbies", "projects", "gallery", "blog"];

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      try {
        const response = await fetch("/api/private/editor");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load drafts.");
        if (!cancelled) setDrafts(data.drafts || {});
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load drafts.");
        }
      }
    }

    loadDrafts();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDraft = async (page: string) => {
    setSavingPage(page);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/private/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, content: drafts[page] || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save draft.");

      setDrafts(data.drafts || {});
      setMessage(`${page.charAt(0).toUpperCase() + page.slice(1)} draft saved privately.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save draft.");
    } finally {
      setSavingPage("");
    }
  };

  return (
    <main className="page">
      <a href="/private" className="back-link">Back to Private</a>
      <h1>Page Editor</h1>
      <p className="muted">Save page drafts here. Publishing these drafts to the public site is still a separate step.</p>
      {error && <p className="error">{error}</p>}
      <div className="editor-pages">
        {pages.map(p => (
          <div key={p} className="editor-card">
            <strong>{p.charAt(0).toUpperCase() + p.slice(1)}</strong>
            <p>Edit the {p} page content here</p>
            <textarea
              placeholder={"Write your " + p + " content..."}
              rows={4}
              value={drafts[p] || ""}
              onChange={event => setDrafts({ ...drafts, [p]: event.target.value })}
            />
            <button onClick={() => saveDraft(p)} disabled={Boolean(savingPage)}>
              {savingPage === p ? "Saving..." : "Save Draft"}
            </button>
          </div>
        ))}
      </div>
      {message && <p className="editor-message">{message}</p>}
    </main>
  );
}
