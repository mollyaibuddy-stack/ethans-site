function toNumber(value) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStatBlock(match) {
  if (!match) {
    return {
      games: 0,
      pts: 0,
      onePt: 0,
      twoPt: 0,
      fouls: 0,
    };
  }

  return {
    games: toNumber(match[1]),
    pts: toNumber(match[2]),
    onePt: toNumber(match[3]),
    twoPt: toNumber(match[4]),
    fouls: toNumber(match[5]),
  };
}

export function parsePlayerStatsText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const statPattern = String.raw`(\d+)\s*Games Played\s*(\d+)\s*Total Points\s*(\d+)\s*1 Point\s*(\d+)\s*2 Points\s*(?:-|\d+)\s*3 Points\s*(\d+)\s*Total Fouls`;

  const career = normalized.match(new RegExp(`Career.*?${statPattern}`, "i"));
  const season = normalized.match(new RegExp(`Player\\s*${statPattern}`, "i"));

  return {
    career: parseStatBlock(career),
    season: parseStatBlock(season),
  };
}
