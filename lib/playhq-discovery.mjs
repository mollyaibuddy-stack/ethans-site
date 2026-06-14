export const PLAYHQ_PROFILE_PATTERN = /https:\/\/www\.playhq\.com\/public\/profile\/[a-f0-9-]+\/statistics(?:\?[^"'\s<]*)?/i;

export function normalizePlayHqProfileUrl(rawUrl) {
  if (!rawUrl) return "";

  let url = String(rawUrl).trim();
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("google.") && parsed.pathname === "/url" && parsed.searchParams.get("q")) {
      url = parsed.searchParams.get("q") || "";
    }
  } catch {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "www.playhq.com") return "";
    if (!parsed.pathname.startsWith("/public/profile/") || !parsed.pathname.endsWith("/statistics")) return "";
    if (!parsed.searchParams.get("tenant")) {
      parsed.searchParams.set("tenant", "basketball-victoria");
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function selectPlayHqProfileSearchResult(results, expectedName = "Ethan He") {
  const expected = expectedName.toLowerCase();
  for (const result of results) {
    const profileUrl = normalizePlayHqProfileUrl(result.href);
    if (!profileUrl) continue;

    const title = String(result.title || "").toLowerCase();
    const text = String(result.text || "").toLowerCase();
    if (title.includes(expected) || text.includes(expected)) {
      return profileUrl;
    }
  }

  return "";
}

export function validateEthanProfileText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").toLowerCase();
  return normalized.includes("ethan he") && normalized.includes("bulleen boomers");
}
