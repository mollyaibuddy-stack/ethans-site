"use client";
import { useState, useEffect } from "react";

interface Task {
  id: number;
  label: string;
  done: boolean;
}

const MONEY_PER_COMPLETE = 20;

const defaultTasks: Task[] = [
  { id: 1, label: "Make my bed", done: false },
  { id: 2, label: "Practice basketball", done: false },
  { id: 3, label: "Finish homework", done: false },
  { id: 4, label: "Read for 20 minutes", done: false },
  { id: 5, label: "Tidy my room", done: false },
];

export default function Checklist() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [newTask, setNewTask] = useState("");
  const [bonusAdded, setBonusAdded] = useState(false);

  const allDone = tasks.length > 0 && tasks.every(t => t.done);

  useEffect(() => {
    if (allDone && !bonusAdded) {
      setBonusAdded(true);
      const prev = JSON.parse(localStorage.getItem("checklist-bonus") || "[]");
      prev.push({ date: new Date().toLocaleDateString("en-AU"), amount: MONEY_PER_COMPLETE });
      localStorage.setItem("checklist-bonus", JSON.stringify(prev));
    }
    if (!allDone) setBonusAdded(false);
  }, [allDone, bonusAdded]);

  const toggle = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), label: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <main className="page">
      <a href="/private" className="back-link">Back to Private</a>
      <h1>Daily Checklist</h1>
      {allDone && <p className="bonus-banner">All done! +${MONEY_PER_COMPLETE} added to your income</p>}

      <div className="task-list">
        {tasks.map(task => (
          <label key={task.id} className={"task-item" + (task.done ? " done" : "")}>
            <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} />
            <span className="task-label">{task.label}</span>
            <button onClick={() => removeTask(task.id)} className="task-remove" aria-label="Remove task">x</button>
          </label>
        ))}
      </div>

      <form onSubmit={addTask} className="add-task-form">
        <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..." />
        <button type="submit">Add</button>
      </form>

      <p className="muted task-info">
        {tasks.filter(t => t.done).length} of {tasks.length} tasks done
      </p>
    </main>
  );
}
