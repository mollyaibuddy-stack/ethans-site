// Local Mac updater for PlayHQ data.
// Uses a persistent browser profile so PlayHQ/Google see a normal local browser session.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  selectPlayHqProfileSearchResult,
  validateEthanProfileText,
} from "../lib/playhq-discovery.mjs";
import { parsePlayerStatsText } from "../lib/playhq-stats.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

const SEARCH_QUERY = "Ethan He playhq bulleen boomers";
const TEAM_URL = process.env.PLAYHQ_TEAM_URL
  || "https://www.playhq.com/basketball-victoria/org/bulleen-boomers-basketball-club/a8924dee/edjba-winter-2026/teams/bulleen-u13-boys-19/21d72c62";
const FALLBACK_PROFILE_URL = process.env.PLAYHQ_PROFILE_URL
  || "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria";
const profileDir = process.env.PLAYHQ_BROWSER_PROFILE_DIR
  || path.join(repoRoot, ".local", "playhq-browser-profile");
const dryRun = process.argv.includes("--dry-run");
const headless = process.env.PLAYHQ_HEADLESS === "1";

async function assertPlayHqPageAvailable(page) {
  const title = await page.title();
  const bodyText = await page.locator("body").textContent({ timeout: 8000 }).catch(() => "");

  if (title.includes("ERROR") || bodyText?.includes("403 ERROR")) {
    throw new Error("PlayHQ blocked this browser request; keeping existing data file unchanged.");
  }
}

async function maybeAcceptGoogleConsent(page) {
  const buttons = [
    page.getByRole("button", { name: /accept all/i }),
    page.getByRole("button", { name: /i agree/i }),
    page.getByRole("button", { name: /agree/i }),
  ];

  for (const button of buttons) {
    if (await button.isVisible({ timeout: 1500 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
}

async function humanPause(minMs = 800, maxMs = 2200) {
  const duration = minMs + Math.floor(Math.random() * (maxMs - minMs));
  await new Promise(resolve => setTimeout(resolve, duration));
}

async function isGoogleCaptchaPage(page) {
  const text = await page.locator("body").textContent({ timeout: 3000 }).catch(() => "");
  return /unusual traffic|sorry|captcha/i.test(text || "");
}

async function discoverProfileUrl(page) {
  await page.goto("https://www.google.com/?hl=en", { waitUntil: "domcontentloaded", timeout: 45000 });
  await maybeAcceptGoogleConsent(page);
  await humanPause();

  if (await isGoogleCaptchaPage(page)) {
    console.log("Google showed a CAPTCHA before search; using validated fallback URL.");
    return FALLBACK_PROFILE_URL;
  }

  const searchBox = page.locator("textarea[name='q'], input[name='q']").first();
  if (!await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Could not find Google search box; using validated fallback URL.");
    return FALLBACK_PROFILE_URL;
  }

  await searchBox.click();
  await humanPause(400, 900);
  await searchBox.pressSequentially(SEARCH_QUERY, { delay: 140 });
  await humanPause(900, 1800);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded", { timeout: 45000 }).catch(() => {});
  await humanPause(3500, 6500);

  if (await isGoogleCaptchaPage(page)) {
    console.log("Google showed a CAPTCHA after manual-style search; using validated fallback URL.");
    return FALLBACK_PROFILE_URL;
  }

  const results = await page.evaluate(() => Array.from(document.querySelectorAll("a")).map(anchor => {
    const heading = anchor.querySelector("h3");
    const container = anchor.closest("div");
    return {
      href: anchor.href,
      title: heading?.textContent || anchor.textContent || "",
      text: container?.textContent || anchor.textContent || "",
    };
  }));

  const discoveredUrl = selectPlayHqProfileSearchResult(results);
  if (discoveredUrl) return discoveredUrl;

  console.log("Could not discover profile URL from Google; using validated fallback URL.");
  return FALLBACK_PROFILE_URL;
}

async function validateProfilePage(page, profileUrl) {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await assertPlayHqPageAvailable(page);
  await page.waitForTimeout(8000);

  const text = await page.locator("body").textContent({ timeout: 10000 });
  if (!validateEthanProfileText(text)) {
    throw new Error("Discovered PlayHQ profile did not validate as Ethan He / Bulleen Boomers.");
  }
}

async function scrapeFixtures(page) {
  await page.goto(TEAM_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await assertPlayHqPageAvailable(page);
  await page.waitForTimeout(8000);

  return await page.evaluate(() => {
    const games = [];
    const gameBlocks = document.querySelectorAll("[aria-label*='Game']");
    gameBlocks.forEach((block) => {
      const text = block.textContent || "";
      const round = text.match(/Round\s+(\d+)/i)?.[1];
      const date = text.match(/(\w+day,\s+\d{1,2}\s+\w+\s+\d{4})/i)?.[1];
      const scores = text.match(/(\d+)\s+Final\s+(\d+)?/);
      const venue = text.match(/Venue\s+(.+?)(?:View game|$)/i);
      const opponent = text.match(/VS\s+(.+?)\s+Round/i);

      if (round) {
        games.push({
          round: Number.parseInt(round, 10),
          date: date || null,
          opponent: opponent?.[1]?.trim() || "TBD",
          ourScore: scores?.[1] ? Number.parseInt(scores[1], 10) : null,
          theirScore: scores?.[2] ? Number.parseInt(scores[2], 10) : null,
          venue: venue?.[1]?.trim() || null,
        });
      }
    });
    return games;
  });
}

async function scrapePlayerStats(page, profileUrl) {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await assertPlayHqPageAvailable(page);
  await page.waitForTimeout(8000);

  const text = await page.locator("body").textContent({ timeout: 10000 });
  return parsePlayerStatsText(text);
}

async function createBrowserContext() {
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    return await chromium.launchPersistentContext(profileDir, {
      channel: "chrome",
      headless,
      viewport: { width: 1440, height: 1000 },
    });
  } catch (chromeError) {
    console.log(`Chrome launch failed; falling back to bundled Chromium: ${chromeError.message}`);
    return await chromium.launchPersistentContext(profileDir, {
      headless,
      viewport: { width: 1440, height: 1000 },
    });
  }
}

const context = await createBrowserContext();
const page = context.pages()[0] || await context.newPage();

try {
  const profileUrl = await discoverProfileUrl(page);
  await validateProfilePage(page, profileUrl);

  const fixtures = await scrapeFixtures(page);
  const stats = await scrapePlayerStats(page, profileUrl);

  if (fixtures.length === 0) {
    throw new Error("PlayHQ scrape returned 0 fixtures; keeping existing data file unchanged.");
  }

  if (stats.career.games === 0 && stats.season.games === 0) {
    throw new Error("PlayHQ scrape returned empty player stats; keeping existing data file unchanged.");
  }

  const data = { fixtures, stats, updated: new Date().toISOString() };
  const outDir = path.join(repoRoot, "public", "data");
  fs.mkdirSync(outDir, { recursive: true });

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      profileUrl,
      fixtures: fixtures.length,
      seasonGames: stats.season.games,
      careerGames: stats.career.games,
    }, null, 2));
  } else {
    fs.writeFileSync(path.join(outDir, "playhq.json"), JSON.stringify(data, null, 2));
    console.log(`Updated PlayHQ data from ${profileUrl}`);
    console.log(`Scraped ${fixtures.length} fixtures and player stats`);
  }
} finally {
  await context.close();
}
