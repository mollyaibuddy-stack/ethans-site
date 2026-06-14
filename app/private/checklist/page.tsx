"use client";

import { useEffect, useState } from "react";
import PrivateTabGuard from "@/components/PrivateTabGuard";
import { DEFAULT_WEEKLY_TASKS, MONEY_PER_COMPLETE } from "@/lib/private-data.mjs";

interface Task {
  id: string;
  label: string;
  done: boolean;
}

export default function Checklist() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>(DEFAULT_WEEKLY_TASKS);
  const [dateKey, setDateKey] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [bonusAdded, setBonusAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allDone = tasks.length > 0 && tasks.every(t => t.done);
  const weeklyDone = weeklyTasks.length > 0 && weeklyTasks.every(t => t.done);

  useEffect(() => {
    let cancelled = false;

    async function loadChecklist() {
      try {
        const response = await fetch("/api/private/checklist");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load checklist.");
        if (!cancelled) {
          setTasks(data.tasks || []);
          setWeeklyTasks(data.weeklyTasks || DEFAULT_WEEKLY_TASKS);
          setDateKey(data.dateKey || "");
          setWeekStart(data.weekStart || "");
          setWeekEnd(data.weekEnd || "");
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
      setWeeklyTasks(data.weeklyTasks || DEFAULT_WEEKLY_TASKS);
      setDateKey(data.dateKey || "");
      setWeekStart(data.weekStart || "");
      setWeekEnd(data.weekEnd || "");
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

  const toggleWeekly = (id: string) => {
    const task = weeklyTasks.find(t => t.id === id);
    if (!task) return;
    saveChecklistAction({ action: "toggleWeekly", id, done: !task.done });
  };

  return (
    <main className="page">
      <PrivateTabGuard />
      <a href="/private" className="back-button">Back to Private</a>
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
            <input
              className="task-checkbox"
              type="checkbox"
              checked={task.done}
              disabled={saving}
              onChange={() => toggle(task.id)}
            />
            <span className="task-label">{task.label}</span>
          </label>
        ))}
      </div>

      <a href="/private/editor" className="checklist-editor-link">Edit tasks in Page Editor</a>

      <p className="muted task-info">
        {tasks.filter(t => t.done).length} of {tasks.length} tasks done{dateKey ? ` for ${dateKey}` : ""}
      </p>

      <section className="weekly-checklist">
        <h2>Weekly Checklist</h2>
        <p className="muted task-info">
          {weeklyTasks.filter(t => t.done).length} of {weeklyTasks.length} weekly tasks done
          {weekStart && weekEnd ? ` for ${weekStart} to ${weekEnd}` : ""}
        </p>
        <div className="task-list">
          {weeklyTasks.map(task => (
            <label key={task.id} className={"task-item" + (task.done ? " done" : "")}>
              <input
                className="task-checkbox"
                type="checkbox"
                checked={task.done}
                disabled={saving}
                onChange={() => toggleWeekly(task.id)}
              />
              <span className="task-label">{task.label}</span>
            </label>
          ))}
        </div>
        {weeklyDone && <p className="bonus-banner">Weekly checklist complete.</p>}
      </section>
    </main>
  );
}
