// PlayHQ scraper for team fixtures + player stats
// Run daily via GitHub Actions, saves JSON to public/data/

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const TEAM_URL = "https://www.playhq.com/basketball-victoria/org/bulleen-boomers-basketball-club/a8924dee/edjba-winter-2026/teams/bulleen-u13-boys-19/21d72c62";
const PROFILE_URL = "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria";

async function scrapeFixtures(br, page) {
  await page.goto(TEAM_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000); // Wait for React to render

  return await page.evaluate(() => {
    const games = [];
    const gameBlocks = document.querySelectorAll("[aria-label*='Game']");
    gameBlocks.forEach((block) => {
      const text = block.textContent;
      // Basic parsing from DOM text
      const round = text.match(/Round\s+(\d+)/i)?.[1];
      const date = text.match(/(\w+day,\s+\d{1,2}\s+\w+\s+\d{4})/i)?.[1];
      const scores = text.match(/(\d+)\s+Final\s+(\d+)?/);
      const venue = text.match(/(\d{2}:\d{2}\s+[AP]M,\s+[A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{2})(.*?)View game/);
      const opponent = text.match(/VS\s+(.+?)\s+Round/);
      
      if (round) {
        games.push({
          round: parseInt(round),
          date: date || null,
          opponent: opponent?.[1]?.trim() || "TBD",
          ourScore: scores?.[1] ? parseInt(scores[1]) : null,
          theirScore: scores?.[2] ? parseInt(scores[2]) : null,
          venue: venue?.[0]?.trim() || null,
        });
      }
    });
    return games;
  });
}

async function scrapePlayerStats(br, page) {
  await page.goto(PROFILE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  return await page.evaluate(() => {
    const text = document.body.textContent;
    
    // Career stats
    const careerGames = text.match(/Career.*?(\d+).*?Games\s+Played/s)?.[1];
    const careerPts = text.match(/Career.*?(\d+).*?Total\s+Points/s)?.[1];
    const career1pt = text.match(/Career.*?(\d+).*?1\s+Point/s)?.[1];
    const career2pt = text.match(/Career.*?(\d+).*?2\s+Points/s)?.[1];
    const careerFouls = text.match(/Career.*?(\d+).*?Total\s+Fouls/s)?.[1];

    // Season stats
    const seasonGames = text.match(/Season\s+Stats.*?(\d+).*?Games\s+Played/s)?.[1];
    const seasonPts = text.match(/Season\s+Stats.*?(\d+).*?Total\s+Points/s)?.[1];
    const season1pt = text.match(/Season\s+Stats.*?(\d+).*?1\s+Point/s)?.[1];
    const season2pt = text.match(/Season\s+Stats.*?(\d+).*?2\s+Points/s)?.[1];
    const seasonFouls = text.match(/Season\s+Stats.*?(\d+).*?Total\s+Fouls/s)?.[1];

    return {
      career: {
        games: parseInt(careerGames) || 0,
        pts: parseInt(careerPts) || 0,
        onePt: parseInt(career1pt) || 0,
        twoPt: parseInt(career2pt) || 0,
        fouls: parseInt(careerFouls) || 0,
      },
      season: {
        games: parseInt(seasonGames) || 0,
        pts: parseInt(seasonPts) || 0,
        onePt: parseInt(season1pt) || 0,
        twoPt: parseInt(season2pt) || 0,
        fouls: parseInt(seasonFouls) || 0,
      },
    };
  });
}

(async () => {
  const br = await chromium.launch();
  const page = await br.newPage();
  
  try {
    const fixtures = await scrapeFixtures(br, page);
    const stats = await scrapePlayerStats(br, page);

    const data = { fixtures, stats, updated: new Date().toISOString() };

    const outDir = path.join(__dirname, "..", "public", "data");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "playhq.json"), JSON.stringify(data, null, 2));
    
    console.log("Scraped " + fixtures.length + " fixtures and player stats");
  } finally {
    await br.close();
  }
})();
