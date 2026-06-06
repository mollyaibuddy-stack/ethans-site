"use client";
import { useState } from "react";

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

  const balance = entries.reduce((sum, e) => 
    e.type === "income" ? sum + e.amount : sum - e.amount, 0
  );

  const addEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    setEntries([...entries, {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-AU"),
      description: desc,
      amount: parseFloat(amount),
      type,
    }]);
    setDesc("");
    setAmount("");
  };

  return (
    <main className="page">
      <a href="/private" className="back-link">Back to Private</a>
      <h1>Money Tracker</h1>
      <h2 className={"balance" + (balance >= 0 ? " positive" : " negative")}>
        Balance: ${balance.toFixed(2)}
      </h2>

      <form onSubmit={addEntry} className="entry-form">
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it for?" />
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" />
        <select value={type} onChange={e => setType(e.target.value as "income" | "expense")}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button type="submit">Add</button>
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
