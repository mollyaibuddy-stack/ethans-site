"use client";

import { useEffect, useState } from "react";

interface F1Race {
  round: string;
  raceName: string;
  circuitName: string;
  location: string;
  startAt: string;
}

interface F1Driver {
  position: string;
  name: string;
  code: string;
  team: string;
  points: string;
}

interface F1Constructor {
  position: string;
  name: string;
  points: string;
}

interface F1WidgetData {
  races: F1Race[];
  drivers: F1Driver[];
  constructors: F1Constructor[];
  standingsRound: string;
  updatedAt: string;
}

function formatRaceDate(startAt: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne",
  }).format(new Date(startAt));
}

export default function F1Widget() {
  const [data, setData] = useState<F1WidgetData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadF1Data() {
      try {
        const response = await fetch("/api/f1");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load F1 data.");
        if (!cancelled) setData(payload);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load F1 data.");
        }
      }
    }

    loadF1Data();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section f1-widget" aria-labelledby="f1-widget-heading">
      <div className="f1-widget-header">
        <div>
          <p className="muted">Formula 1</p>
          <h2 id="f1-widget-heading">Next races and live standings</h2>
        </div>
        {data?.standingsRound && <span className="f1-chip">After round {data.standingsRound}</span>}
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="muted">Loading F1 data...</p>}

      {data && (
        <div className="f1-grid">
          <div className="f1-panel">
            <h3>Next two races</h3>
            <div className="f1-race-list">
              {data.races.map(race => (
                <article key={race.round} className="f1-race">
                  <span className="f1-position">R{race.round}</span>
                  <div>
                    <strong>{race.raceName}</strong>
                    <p>{formatRaceDate(race.startAt)}</p>
                    <p>{race.circuitName} · {race.location}</p>
                  </div>
                </article>
              ))}
              {data.races.length === 0 && <p className="muted">No upcoming races found.</p>}
            </div>
          </div>

          <div className="f1-panel">
            <h3>Top drivers</h3>
            <ol className="f1-standings">
              {data.drivers.map(driver => (
                <li key={driver.position}>
                  <span className="f1-position">{driver.position}</span>
                  <span>
                    <strong>{driver.name}</strong>
                    <small>{driver.code} · {driver.team}</small>
                  </span>
                  <b>{driver.points}</b>
                </li>
              ))}
            </ol>
          </div>

          <div className="f1-panel">
            <h3>Top teams</h3>
            <ol className="f1-standings">
              {data.constructors.map(team => (
                <li key={team.position}>
                  <span className="f1-position">{team.position}</span>
                  <span><strong>{team.name}</strong></span>
                  <b>{team.points}</b>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
