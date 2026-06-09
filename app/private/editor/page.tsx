"use client";

import { useEffect, useState } from "react";
import PrivateTabGuard from "@/components/PrivateTabGuard";
import { ENTRY_DRAFT_PAGES, createDraftEntry, updateDraftEntry } from "@/lib/private-store.mjs";

interface DraftEntry {
  id: string;
  title: string;
  text: string;
  image: string;
}

type EntryDrafts = Record<string, DraftEntry[]>;

const plainPages = ["about"];
const entryPages = ENTRY_DRAFT_PAGES;

function pageTitle(page: string) {
  return page.charAt(0).toUpperCase() + page.slice(1);
}

function parseEntryDraft(raw: string | undefined): DraftEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry, index) => ({
      id: String(entry.id || `${Date.now()}-${index}`),
      title: String(entry.title || ""),
      text: String(entry.text || ""),
      image: String(entry.image || ""),
    }));
  } catch {
    return [];
  }
}

export default function Editor() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [entryDrafts, setEntryDrafts] = useState<EntryDrafts>({
    hobbies: [],
    projects: [],
    blog: [],
  });
  const [savingPage, setSavingPage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      try {
        const response = await fetch("/api/private/editor");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load drafts.");
        if (!cancelled) {
          const nextDrafts = data.drafts || {};
          setDrafts(nextDrafts);
          setEntryDrafts({
            hobbies: parseEntryDraft(nextDrafts.hobbies),
            projects: parseEntryDraft(nextDrafts.projects),
            blog: parseEntryDraft(nextDrafts.blog),
          });
        }
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

  const saveDraft = async (page: string, content: string) => {
    setSavingPage(page);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/private/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save draft.");

      setDrafts(data.drafts || {});
      setMessage(`${pageTitle(page)} draft saved privately.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save draft.");
    } finally {
      setSavingPage("");
    }
  };

  const savePlainDraft = (page: string) => {
    saveDraft(page, drafts[page] || "");
  };

  const saveEntryDraft = (page: string) => {
    saveDraft(page, JSON.stringify(entryDrafts[page] || []));
  };

  const addEntry = (page: string) => {
    setEntryDrafts({
      ...entryDrafts,
      [page]: [
        ...(entryDrafts[page] || []),
        createDraftEntry({ title: "", text: "" }),
      ],
    });
  };

  const changeEntry = (page: string, id: string, patch: Partial<DraftEntry>) => {
    setEntryDrafts({
      ...entryDrafts,
      [page]: updateDraftEntry(entryDrafts[page] || [], id, patch),
    });
  };

  const removeEntry = (page: string, id: string) => {
    setEntryDrafts({
      ...entryDrafts,
      [page]: (entryDrafts[page] || []).filter(entry => entry.id !== id),
    });
  };

  const uploadImage = (page: string, id: string, file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      changeEntry(page, id, { image: String(reader.result || "") });
    };
    reader.onerror = () => {
      setError("Could not read that image.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="page">
      <PrivateTabGuard />
      <a href="/private" className="back-button">Back to Private</a>
      <h1>Page Editor</h1>
      <p className="muted">Save page drafts here. Publishing these drafts to the public site is still a separate step.</p>
      {error && <p className="error">{error}</p>}
      <div className="editor-pages">
        {plainPages.map(p => (
          <div key={p} className="editor-card">
            <strong>{pageTitle(p)}</strong>
            <p>Edit the {p} page content here</p>
            <textarea
              placeholder={"Write your " + p + " content..."}
              rows={4}
              value={drafts[p] || ""}
              onChange={event => setDrafts({ ...drafts, [p]: event.target.value })}
            />
            <button onClick={() => savePlainDraft(p)} disabled={Boolean(savingPage)}>
              {savingPage === p ? "Saving..." : "Save Draft"}
            </button>
          </div>
        ))}

        {entryPages.map(page => (
          <div key={page} className="editor-card editor-card-wide">
            <div className="editor-card-header">
              <div>
                <strong>{pageTitle(page)}</strong>
                <p>Add multiple entries with optional images</p>
              </div>
              <button type="button" onClick={() => addEntry(page)}>Add Entry</button>
            </div>

            <div className="draft-entry-list">
              {(entryDrafts[page] || []).map(entry => (
                <div key={entry.id} className="draft-entry">
                  <input
                    value={entry.title}
                    onChange={event => changeEntry(page, entry.id, { title: event.target.value })}
                    placeholder="Entry title"
                  />
                  <textarea
                    value={entry.text}
                    onChange={event => changeEntry(page, entry.id, { text: event.target.value })}
                    placeholder="Entry text"
                    rows={4}
                  />
                  {entry.image && (
                    <img src={entry.image} alt="" className="draft-entry-image" />
                  )}
                  <div className="draft-entry-actions">
                    <label className="file-button">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={event => uploadImage(page, entry.id, event.target.files?.[0] || null)}
                      />
                    </label>
                    {entry.image && (
                      <button type="button" onClick={() => changeEntry(page, entry.id, { image: "" })}>
                        Remove Image
                      </button>
                    )}
                    <button type="button" onClick={() => removeEntry(page, entry.id)}>
                      Remove Entry
                    </button>
                  </div>
                </div>
              ))}
              {(entryDrafts[page] || []).length === 0 && (
                <p className="muted">No entries yet.</p>
              )}
            </div>

            <button onClick={() => saveEntryDraft(page)} disabled={Boolean(savingPage)}>
              {savingPage === page ? "Saving..." : `Save ${pageTitle(page)} Draft`}
            </button>
          </div>
        ))}
      </div>
      {message && <p className="editor-message">{message}</p>}
    </main>
  );
}
