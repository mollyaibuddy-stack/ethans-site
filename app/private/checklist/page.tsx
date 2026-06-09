"use client";

import { useEffect, useState } from "react";
import { MONEY_PER_COMPLETE } from "@/lib/private-data.mjs";

interface Task {
  id: string;
  label: string;
  done: boolean;
}

export default function Checklist() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [dateKey, setDateKey] = useState("");
  const [bonusAdded, setBonusAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allDone = tasks.length > 0 && tasks.every(t => t.done);

  useEffect(() => {
    let cancelled = false;

    async function loadChecklist() {
      try {
        const response = await fetch("/api/private/checklist");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load checklist.");
        if (!cancelled) {
          setTasks(data.tasks || []);
          setDateKey(data.dateKey || "");
          setBonusAdded(Boolean(data.bonusAdded));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load checklist.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChecklist();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveChecklistAction = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/private/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save checklist.");

      setTasks(data.tasks || []);
      setDateKey(data.dateKey || "");
      setBonusAdded(Boolean(data.bonusAdded));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save checklist.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    saveChecklistAction({ action: "toggle", id, done: !task.done });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    saveChecklistAction({ action: "add", label: newTask.trim() });
    setNewTask("");
  };

  const removeTask = (id: string) => {
    saveChecklistAction({ action: "remove", id });
  };

  return (
    <main className="page">
      <a href="/private" className="back-link">Back to Private</a>
      <h1>Daily Checklist</h1>
      {loading && <p className="muted">Loading checklist...</p>}
      {error && <p className="error">{error}</p>}
      {allDone && (
        <p className="bonus-banner">
          All done! {bonusAdded ? `+$${MONEY_PER_COMPLETE} added to your income` : "Saving bonus..."}
        </p>
      )}

      <div className="task-list">
        {tasks.map(task => (
          <label key={task.id} className={"task-item" + (task.done ? " done" : "")}>
            <input type="checkbox" checked={task.done} disabled={saving} onChange={() => toggle(task.id)} />
            <span className="task-label">{task.label}</span>
            <button
              onClick={event => {
                event.preventDefault();
                removeTask(task.id);
              }}
              className="task-remove"
              aria-label="Remove task"
              disabled={saving}
            >
              x
            </button>
          </label>
        ))}
      </div>

      <form onSubmit={addTask} className="add-task-form">
        <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..." />
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Add"}</button>
      </form>

      <p className="muted task-info">
        {tasks.filter(t => t.done).length} of {tasks.length} tasks done{dateKey ? ` for ${dateKey}` : ""}
      </p>
    </main>
  );
}
