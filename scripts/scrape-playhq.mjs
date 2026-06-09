// PlayHQ scraper for team fixtures + player stats.
// Run daily via GitHub Actions, saves JSON to public/data/.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEAM_URL = "https://www.playhq.com/basketball-victoria/org/bulleen-boomers-basketball-club/a8924dee/edjba-winter-2026/teams/bulleen-u13-boys-19/21d72c62";
const PROFILE_URL = "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria";

async function assertPlayHqPageAvailable(page) {
  const title = await page.title();
  const bodyText = await page.locator("body").textContent({ timeout: 5000 }).catch(() => "");

  if (title.includes("ERROR") || bodyText?.includes("403 ERROR")) {
    throw new Error("PlayHQ blocked this automated request with a CloudFront 403; keeping existing data file unchanged.");
  }
}

async function scrapeFixtures(page) {
  await page.goto(TEAM_URL, { waitUntil: "networkidle", timeout: 30000 });
  await assertPlayHqPageAvailable(page);
  await page.waitForTimeout(3000);

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

async function scrapePlayerStats(page) {
  await page.goto(PROFILE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await assertPlayHqPageAvailable(page);
  await page.waitForTimeout(3000);

  return await page.evaluate(() => {
    const text = document.body.textContent || "";

    const careerGames = text.match(/Career.*?(\d+).*?Games\s+Played/s)?.[1];
    const careerPts = text.match(/Career.*?(\d+).*?Total\s+Points/s)?.[1];
    const career1pt = text.match(/Career.*?(\d+).*?1\s+Point/s)?.[1];
    const career2pt = text.match(/Career.*?(\d+).*?2\s+Points/s)?.[1];
    const careerFouls = text.match(/Career.*?(\d+).*?Total\s+Fouls/s)?.[1];

    const seasonGames = text.match(/Season\s+Stats.*?(\d+).*?Games\s+Played/s)?.[1];
    const seasonPts = text.match(/Season\s+Stats.*?(\d+).*?Total\s+Points/s)?.[1];
    const season1pt = text.match(/Season\s+Stats.*?(\d+).*?1\s+Point/s)?.[1];
    const season2pt = text.match(/Season\s+Stats.*?(\d+).*?2\s+Points/s)?.[1];
    const seasonFouls = text.match(/Season\s+Stats.*?(\d+).*?Total\s+Fouls/s)?.[1];

    return {
      career: {
        games: Number.parseInt(careerGames || "0", 10),
        pts: Number.parseInt(careerPts || "0", 10),
        onePt: Number.parseInt(career1pt || "0", 10),
        twoPt: Number.parseInt(career2pt || "0", 10),
        fouls: Number.parseInt(careerFouls || "0", 10),
      },
      season: {
        games: Number.parseInt(seasonGames || "0", 10),
        pts: Number.parseInt(seasonPts || "0", 10),
        onePt: Number.parseInt(season1pt || "0", 10),
        twoPt: Number.parseInt(season2pt || "0", 10),
        fouls: Number.parseInt(seasonFouls || "0", 10),
      },
    };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  const fixtures = await scrapeFixtures(page);
  const stats = await scrapePlayerStats(page);

  if (fixtures.length === 0) {
    throw new Error("PlayHQ scrape returned 0 fixtures; keeping existing data file unchanged.");
  }

  if (stats.career.games === 0 && stats.season.games === 0) {
    throw new Error("PlayHQ scrape returned empty player stats; keeping existing data file unchanged.");
  }

  const data = { fixtures, stats, updated: new Date().toISOString() };

  const outDir = path.join(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "playhq.json"), JSON.stringify(data, null, 2));

  console.log(`Scraped ${fixtures.length} fixtures and player stats`);
} finally {
  await browser.close();
}
