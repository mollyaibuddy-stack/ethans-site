import Navbar from "@/components/Navbar";

export default function Basketball() {
  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Basketball</h1>

        <section className="section">
          <h2>My Team</h2>
          <p><strong>Club:</strong> Bulleen Boomers</p>
          <p><strong>Team:</strong> Boys U13 — Team 19</p>
          <p><strong>League:</strong> EDJBA Winter 2026</p>
        </section>

        <section className="section">
          <h2>My Stats — Winter 2026</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">4</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">52</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">13.0</span>
              <span className="stat-label">PPG</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">25</span>
              <span className="stat-label">2-Pointers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">2</span>
              <span className="stat-label">Free Throws</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">6</span>
              <span className="stat-label">Fouls</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Game by Game</h2>
          <div className="fixture-card">
            <table className="fixture-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Team Score</th>
                  <th>My Points</th>
                  <th>2PT</th>
                  <th>1PT</th>
                  <th>Fouls</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td><td>May 2</td><td>Collingwood U13 Boys 08</td>
                  <td>20-29 ❌</td><td>4</td><td>2</td><td>0</td><td>1</td>
                </tr>
                <tr>
                  <td>2</td><td>May 9</td><td>Eltham U13 Boys 36</td>
                  <td>53-16 ✅</td><td>14</td><td>7</td><td>0</td><td>0</td>
                </tr>
                <tr>
                  <td>3</td><td>May 16</td><td>Blackburn U13 Boys 14</td>
                  <td>62-14 ✅</td><td>16</td><td>7</td><td>2</td><td>2</td>
                </tr>
                <tr>
                  <td>4</td><td>May 23</td><td>Eltham U13 Boys 21</td><td>29-15 ✅</td><td className="muted">—</td><td className="muted">—</td><td className="muted">—</td><td className="muted">—</td>
                </tr>
                <tr>
                  <td>5</td><td>May 30</td><td>Balwyn U13 Boys 06</td><td>45-21 ✅</td><td>18</td><td>9</td><td>0</td><td>3</td>
                </tr>
                <tr>
                  <td>6</td><td>Jun 13</td><td>Eltham U13 Boys 20</td>
                  <td>⏳ Upcoming</td><td className="muted">—</td><td className="muted">—</td><td className="muted">—</td><td className="muted">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted" style={{marginTop: "0.75rem"}}>
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
              <span className="stat-number">153</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">434</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">194</span>
              <span className="stat-label">2-Pointers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">46</span>
              <span className="stat-label">Free Throws</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">148</span>
              <span className="stat-label">Fouls</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}




