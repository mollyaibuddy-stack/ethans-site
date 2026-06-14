import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultPlayHqConfigPath,
  readPlayHqConfig,
  writePlayHqConfig,
} from "../lib/playhq-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const label = "com.ethan.playhq-updater";
const controlLabel = "com.ethan.playhq-control";
const uid = process.getuid();
const guiDomain = `gui/${uid}`;
const host = process.env.PLAYHQ_CONTROL_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.PLAYHQ_CONTROL_PORT || "8787", 10);
const updaterPlist = path.join(process.env.HOME, "Library", "LaunchAgents", `${label}.plist`);
const sourceUpdaterPlist = path.join(repoRoot, "scripts", `${label}.plist`);
const configPath = defaultPlayHqConfigPath(repoRoot);
const logPath = path.join(repoRoot, "logs", "playhq-update.log");

function runCommand(command, args, options = {}) {
  return new Promise(resolve => {
    execFile(command, args, { cwd: repoRoot, timeout: options.timeout || 15000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code || 0,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
      });
    });
  });
}

async function launchctl(args) {
  return runCommand("launchctl", args);
}

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function html(res, body) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function noContent(res) {
  res.writeHead(204, { "Cache-Control": "no-store" });
  res.end();
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function tailLog(lines = 80) {
  if (!fs.existsSync(logPath)) return "";
  return fs.readFileSync(logPath, "utf8").split("\n").slice(-lines).join("\n");
}

function readLatestDataSummary() {
  const dataPath = path.join(repoRoot, "public", "data", "playhq.json");
  if (!fs.existsSync(dataPath)) return null;
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  return {
    updated: data.updated,
    fixtures: data.fixtures?.length || 0,
    seasonGames: data.stats?.season?.games || 0,
    seasonPoints: data.stats?.season?.pts || 0,
    careerGames: data.stats?.career?.games || 0,
    careerPoints: data.stats?.career?.pts || 0,
  };
}

async function getUpdaterStatus() {
  const printResult = await launchctl(["print", `${guiDomain}/${label}`]);
  const serviceText = `${printResult.stdout}\n${printResult.stderr}`;
  const running = /state = running|active count = [1-9]/.test(serviceText);
  const loaded = printResult.ok;
  const disabled = /disabled = true/.test(serviceText);

  return {
    label,
    controlLabel,
    loaded,
    running,
    enabled: loaded && !disabled,
    state: running ? "running" : loaded ? "scheduled" : "disabled",
    schedule: "Wednesday 7:30 AM",
    latestData: readLatestDataSummary(),
    log: tailLog(),
  };
}

async function enableSchedule() {
  fs.mkdirSync(path.dirname(updaterPlist), { recursive: true });
  if (!fs.existsSync(updaterPlist)) {
    fs.copyFileSync(sourceUpdaterPlist, updaterPlist);
  }
  await launchctl(["bootout", guiDomain, updaterPlist]);
  const bootstrap = await launchctl(["bootstrap", guiDomain, updaterPlist]);
  const enable = await launchctl(["enable", `${guiDomain}/${label}`]);
  return { bootstrap, enable };
}

async function disableSchedule() {
  return launchctl(["bootout", guiDomain, updaterPlist]);
}

async function stopCurrentRun() {
  return launchctl(["kill", "TERM", `${guiDomain}/${label}`]);
}

async function runNow() {
  await enableSchedule();
  return launchctl(["kickstart", "-k", `${guiDomain}/${label}`]);
}

function renderPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PlayHQ Updater Control</title>
  <style>
    :root { color-scheme: light dark; --bg: #101214; --surface: #181c20; --surface-2: #20262b; --text: #f1f5f9; --muted: #9aa8b5; --border: #33404a; --accent: #64d2ff; --danger: #ff6b6b; --ok: #8ee09a; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
    main { width: min(1080px, calc(100vw - 32px)); margin: 32px auto; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 2rem; line-height: 1.1; }
    h2 { margin: 0 0 14px; font-size: 1.15rem; }
    p { color: var(--muted); line-height: 1.5; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .panel { border: 1px solid var(--border); background: var(--surface); border-radius: 8px; padding: 18px; }
    .wide { grid-column: 1 / -1; }
    .status { display: inline-flex; align-items: center; min-height: 36px; padding: 0 12px; border: 1px solid var(--border); border-radius: 999px; font-weight: 800; }
    .status.running { color: var(--ok); }
    .status.disabled { color: var(--danger); }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    button { min-height: 44px; border: 0; border-radius: 7px; padding: 0 14px; font-weight: 800; cursor: pointer; background: var(--accent); color: #071015; }
    button.secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
    button.danger { background: var(--danger); color: #170202; }
    label { display: block; font-weight: 800; margin: 14px 0 6px; }
    input { width: 100%; min-height: 44px; border: 1px solid var(--border); border-radius: 7px; padding: 0 12px; background: var(--surface-2); color: var(--text); font: inherit; }
    dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 14px; margin: 0; }
    dt { color: var(--muted); }
    dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
    pre { min-height: 220px; max-height: 420px; overflow: auto; white-space: pre-wrap; background: #090b0d; border: 1px solid var(--border); border-radius: 8px; padding: 14px; color: #c8d3dc; }
    .message { min-height: 24px; color: var(--muted); font-weight: 700; }
    @media (max-width: 780px) { header { flex-direction: column; } .grid { grid-template-columns: 1fr; } dl { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>PlayHQ Updater Control</h1>
        <p>Local controls for Ethan's basketball data updater on this Mac Mini.</p>
      </div>
      <div id="state" class="status">Loading</div>
    </header>

    <div class="grid">
      <section class="panel">
        <h2>Launcher</h2>
        <dl>
          <dt>Schedule</dt><dd id="schedule">-</dd>
          <dt>Service</dt><dd id="service">-</dd>
          <dt>Latest data</dt><dd id="latest">-</dd>
          <dt>Season</dt><dd id="season">-</dd>
        </dl>
      </section>

      <section class="panel">
        <h2>Actions</h2>
        <div class="actions">
          <button onclick="postAction('/api/run-now')">Run now</button>
          <button class="secondary" onclick="postAction('/api/enable-schedule')">Enable schedule</button>
          <button class="secondary" onclick="postAction('/api/disable-schedule')">Disable schedule</button>
          <button class="danger" onclick="postAction('/api/stop-current-run')">Stop current run</button>
        </div>
        <p class="message" id="message"></p>
      </section>

      <section class="panel wide">
        <h2>Search Settings</h2>
        <form id="config-form">
          <label for="searchQuery">Search keywords</label>
          <input id="searchQuery" name="searchQuery" autocomplete="off" />
          <label for="profileUrl">Exact PlayHQ profile link</label>
          <input id="profileUrl" name="profileUrl" autocomplete="off" />
          <label for="teamUrl">Team PlayHQ link</label>
          <input id="teamUrl" name="teamUrl" autocomplete="off" />
          <p><button type="submit">Save settings</button></p>
        </form>
      </section>

      <section class="panel wide">
        <h2>Recent Log</h2>
        <pre id="log">Loading...</pre>
      </section>
    </div>
  </main>

  <script>
    async function getJson(url) {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
    async function postAction(url, body) {
      document.getElementById('message').textContent = 'Working...';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : '{}',
      });
      const data = await response.json().catch(() => ({}));
      document.getElementById('message').textContent = data.message || (response.ok ? 'Done.' : 'Action failed.');
      await refresh();
    }
    async function refresh() {
      const [status, config] = await Promise.all([getJson('/api/status'), getJson('/api/config')]);
      const state = document.getElementById('state');
      state.textContent = status.state;
      state.className = 'status ' + status.state;
      document.getElementById('schedule').textContent = status.schedule;
      document.getElementById('service').textContent = status.loaded ? (status.running ? 'Running now' : 'Loaded') : 'Not loaded';
      document.getElementById('latest').textContent = status.latestData?.updated || 'No data file yet';
      document.getElementById('season').textContent = status.latestData ? status.latestData.seasonGames + ' games, ' + status.latestData.seasonPoints + ' points' : '-';
      document.getElementById('log').textContent = status.log || 'No log yet.';
      document.getElementById('searchQuery').value = config.searchQuery || '';
      document.getElementById('profileUrl').value = config.profileUrl || '';
      document.getElementById('teamUrl').value = config.teamUrl || '';
    }
    document.getElementById('config-form').addEventListener('submit', async event => {
      event.preventDefault();
      await postAction('/api/config', {
        searchQuery: document.getElementById('searchQuery').value,
        profileUrl: document.getElementById('profileUrl').value,
        teamUrl: document.getElementById('teamUrl').value,
      });
    });
    refresh().catch(error => {
      document.getElementById('message').textContent = error.message;
    });
    setInterval(refresh, 15000);
  </script>
</body>
</html>`;
}

async function route(req, res) {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);

  try {
    if (method === "GET" && url.pathname === "/") return html(res, renderPage());
    if (method === "GET" && url.pathname === "/favicon.ico") return noContent(res);
    if (method === "GET" && url.pathname === "/api/status") return json(res, 200, await getUpdaterStatus());
    if (method === "GET" && url.pathname === "/api/config") return json(res, 200, readPlayHqConfig(configPath));
    if (method === "POST" && url.pathname === "/api/config") {
      const config = writePlayHqConfig(configPath, await readRequestJson(req));
      return json(res, 200, { message: "Settings saved.", ...config });
    }
    if (method === "POST" && url.pathname === "/api/run-now") return json(res, 200, { message: "Updater started.", result: await runNow() });
    if (method === "POST" && url.pathname === "/api/stop-current-run") return json(res, 200, { message: "Stop signal sent.", result: await stopCurrentRun() });
    if (method === "POST" && url.pathname === "/api/disable-schedule") return json(res, 200, { message: "Schedule disabled.", result: await disableSchedule() });
    if (method === "POST" && url.pathname === "/api/enable-schedule") return json(res, 200, { message: "Schedule enabled.", result: await enableSchedule() });

    return json(res, 404, { error: "Not found." });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unknown error." });
  }
}

const server = http.createServer(route);
server.listen(port, host, () => {
  console.log(`PlayHQ control panel: http://${host}:${port}`);
});
