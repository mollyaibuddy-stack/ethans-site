import Navbar from "@/components/Navbar";
import playhqData from "@/public/data/playhq.json";

interface Fixture {
  round: number;
  date: string | null;
  opponent: string;
  ourScore: number | null;
  theirScore: number | null;
  venue: string | null;
}

const monthNumbers: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function parseFixtureDate(value: string | null) {
  if (!value) return null;
  const match = value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const month = monthNumbers[match[2].toLowerCase()];
  const year = Number.parseInt(match[3], 10);
  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;

  return new Date(year, month, day);
}

function resultLabel(fixture: Fixture) {
  if (fixture.ourScore === null || fixture.theirScore === null) return "Upcoming";
  if (fixture.ourScore > fixture.theirScore) return `Won by ${fixture.ourScore - fixture.theirScore}`;
  if (fixture.ourScore < fixture.theirScore) return `Lost by ${fixture.theirScore - fixture.ourScore}`;
  return "Draw";
}

export default function Basketball() {
  const fixtures = [...(playhqData.fixtures as Fixture[])].sort((a, b) => a.round - b.round);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingFixtures = fixtures
    .filter(fixture => {
      const fixtureDate = parseFixtureDate(fixture.date);
      return fixture.ourScore === null || fixture.theirScore === null || (fixtureDate && fixtureDate >= today);
    })
    .slice(0, 2);

  const season = playhqData.stats.season;
  const career = playhqData.stats.career;

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Basketball</h1>

        <section className="section">
          <h2>My Team</h2>
          <p><strong>Club:</strong> Bulleen Boomers</p>
          <p><strong>Team:</strong> Boys U13 - Team 19</p>
          <p><strong>League:</strong> EDJBA Winter 2026</p>
        </section>

        <section className="section">
          <h2>This Week and Next Week</h2>
          <div className="fixture-card">
            <table className="fixture-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                {upcomingFixtures.map(fixture => (
                  <tr key={fixture.round}>
                    <td>{fixture.round}</td>
                    <td>{fixture.date || "TBD"}</td>
                    <td>{fixture.opponent}</td>
                    <td>{fixture.venue || "TBD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Last updated from PlayHQ: {new Date(playhqData.updated).toLocaleString("en-AU")}
          </p>
        </section>

        <section className="section">
          <h2>My Stats - Winter 2026</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{season.games}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{season.pts}</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{season.games ? (season.pts / season.games).toFixed(1) : "0.0"}</span>
              <span className="stat-label">PPG</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{season.twoPt}</span>
              <span className="stat-label">2-Pointers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{season.onePt}</span>
              <span className="stat-label">Free Throws</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{season.fouls}</span>
              <span className="stat-label">Fouls</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Team Fixtures</h2>
          <div className="fixture-card">
            <table className="fixture-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map(fixture => (
                  <tr key={fixture.round}>
                    <td>{fixture.round}</td>
                    <td>{fixture.date || "TBD"}</td>
                    <td>{fixture.opponent}</td>
                    <td>
                      {fixture.ourScore === null || fixture.theirScore === null
                        ? "Upcoming"
                        : `${fixture.ourScore}-${fixture.theirScore}`}
                    </td>
                    <td>{resultLabel(fixture)}</td>
                    <td>{fixture.venue || "TBD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Stats auto-updated from my{" "}
            <a href="https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria" target="_blank" rel="noopener">
              PlayHQ profile
            </a>
          </p>
        </section>

        <section className="section">
          <h2>Career Totals</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{career.games}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{career.pts}</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{career.twoPt}</span>
              <span className="stat-label">2-Pointers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{career.onePt}</span>
              <span className="stat-label">Free Throws</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{career.fouls}</span>
              <span className="stat-label">Fouls</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
