import fs from "node:fs";
import path from "node:path";
import { normalizePlayHqProfileUrl } from "./playhq-discovery.mjs";

export const DEFAULT_PLAYHQ_CONFIG = {
  searchQuery: "Ethan He playhq bulleen boomers",
  profileUrl: "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria",
  teamUrl: "https://www.playhq.com/basketball-victoria/org/bulleen-boomers-basketball-club/a8924dee/edjba-winter-2026/teams/bulleen-u13-boys-19/21d72c62",
};

export function defaultPlayHqConfigPath(repoRoot) {
  return path.join(repoRoot, "config", "playhq-updater.json");
}

function normalizeTeamUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return DEFAULT_PLAYHQ_CONFIG.teamUrl;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Team URL must be a PlayHQ URL.");
  }

  if (parsed.hostname !== "www.playhq.com") {
    throw new Error("Team URL must be a PlayHQ URL.");
  }

  return parsed.toString();
}

export function sanitizePlayHqConfig(input = {}) {
  const searchQuery = String(input.searchQuery || DEFAULT_PLAYHQ_CONFIG.searchQuery).trim();
  const profileUrl = normalizePlayHqProfileUrl(input.profileUrl || DEFAULT_PLAYHQ_CONFIG.profileUrl);
  if (!profileUrl) {
    throw new Error("Profile URL must be a PlayHQ public profile statistics URL.");
  }

  return {
    searchQuery: searchQuery || DEFAULT_PLAYHQ_CONFIG.searchQuery,
    profileUrl,
    teamUrl: normalizeTeamUrl(input.teamUrl || DEFAULT_PLAYHQ_CONFIG.teamUrl),
  };
}

export function readPlayHqConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return DEFAULT_PLAYHQ_CONFIG;
  }

  const raw = fs.readFileSync(configPath, "utf8");
  return sanitizePlayHqConfig(JSON.parse(raw));
}

export function writePlayHqConfig(configPath, input) {
  const config = sanitizePlayHqConfig(input);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return config;
}
