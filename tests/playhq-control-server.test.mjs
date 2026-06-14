import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const serverSource = fs.readFileSync(new URL("../scripts/playhq-control-server.mjs", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const plistSource = fs.readFileSync(new URL("../scripts/com.ethan.playhq-control.plist", import.meta.url), "utf8");

test("local PlayHQ control server exposes launcher status and actions", () => {
  assert.match(serverSource, /method === "GET" && url\.pathname === "\/api\/status"/);
  assert.match(serverSource, /method === "POST" && url\.pathname === "\/api\/run-now"/);
  assert.match(serverSource, /method === "POST" && url\.pathname === "\/api\/stop-current-run"/);
  assert.match(serverSource, /method === "POST" && url\.pathname === "\/api\/disable-schedule"/);
  assert.match(serverSource, /method === "POST" && url\.pathname === "\/api\/enable-schedule"/);
  assert.match(serverSource, /launchctl/);
  assert.match(serverSource, /kickstart/);
  assert.match(serverSource, /com\.ethan\.playhq-updater/);
});

test("local PlayHQ control server exposes editable search settings", () => {
  assert.match(serverSource, /method === "GET" && url\.pathname === "\/api\/config"/);
  assert.match(serverSource, /method === "POST" && url\.pathname === "\/api\/config"/);
  assert.match(serverSource, /Search keywords/);
  assert.match(serverSource, /Exact PlayHQ profile link/);
  assert.match(serverSource, /Team PlayHQ link/);
});

test("control server can be installed as a Mac LaunchAgent", () => {
  assert.match(packageSource, /playhq:control/);
  assert.match(packageSource, /playhq:install-control/);
  assert.match(plistSource, /com\.ethan\.playhq-control/);
  assert.match(plistSource, /\/usr\/bin\/env/);
  assert.match(plistSource, /playhq-control-server\.mjs/);
});
