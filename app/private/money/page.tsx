"use client";

import { useEffect, useState } from "react";
import { calculateBalance } from "@/lib/private-data.mjs";

interface Entry {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export default function MoneyTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      try {
        const response = await fetch("/api/private/money");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load money entries.");
        if (!cancelled) setEntries(data.entries || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load money entries.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEntries();
    return () => {
      cancelled = true;
    };
  }, []);

  const balance = calculateBalance(entries);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/private/money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc.trim(), amount, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save money entry.");

      setEntries(data.entries || []);
      setDesc("");
      setAmount("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save money entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <a href="/private" className="back-button">Back to Private</a>
      <h1>Money Tracker</h1>
      <h2 className={"balance" + (balance >= 0 ? " positive" : " negative")}>
        Balance: ${balance.toFixed(2)}
      </h2>
      {loading && <p className="muted">Loading money entries...</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={addEntry} className="entry-form">
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it for?" />
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" />
        <select value={type} onChange={e => setType(e.target.value as "income" | "expense")}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Add"}</button>
      </form>

      <table className="entry-table">
        <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th></tr></thead>
        <tbody>
          {entries.slice().reverse().map(e => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.description}</td>
              <td className={e.type === "income" ? "positive" : "negative"}>
                {e.type === "income" ? "+" : "-"}${e.amount.toFixed(2)}
              </td>
              <td>{e.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
