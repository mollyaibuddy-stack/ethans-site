const F1_BASE_URL = "https://api.jolpi.ca/ergast/f1";

function raceStart(race) {
  return new Date(`${race.date}T${race.time || "00:00:00Z"}`);
}

function raceLocation(race) {
  const location = race.Circuit?.Location || {};
  return [location.locality, location.country].filter(Boolean).join(", ");
}

export function getUpcomingRaces(races, now = new Date(), count = 2) {
  return races
    .map(race => ({
      round: String(race.round),
      raceName: race.raceName,
      circuitName: race.Circuit?.circuitName || "",
      location: raceLocation(race),
      date: race.date,
      time: race.time || "",
      startAt: raceStart(race).toISOString(),
    }))
    .filter(race => new Date(race.startAt) >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, count);
}

export function mapDriverStandings(standings, count = 3) {
  return standings.slice(0, count).map(standing => ({
    position: String(standing.position),
    name: `${standing.Driver?.givenName || ""} ${standing.Driver?.familyName || ""}`.trim(),
    code: standing.Driver?.code || "",
    team: standing.Constructors?.[0]?.name || "",
    points: String(standing.points),
  }));
}

export function mapConstructorStandings(standings, count = 3) {
  return standings.slice(0, count).map(standing => ({
    position: String(standing.position),
    name: standing.Constructor?.name || "",
    points: String(standing.points),
  }));
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`F1 data request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchF1WidgetData(fetchImpl = fetch, now = new Date()) {
  const [schedule, drivers, constructors] = await Promise.all([
    fetchJson(fetchImpl, `${F1_BASE_URL}/current.json?limit=100`),
    fetchJson(fetchImpl, `${F1_BASE_URL}/current/driverstandings.json`),
    fetchJson(fetchImpl, `${F1_BASE_URL}/current/constructorstandings.json`),
  ]);

  const driverList = drivers.MRData?.StandingsTable?.StandingsLists?.[0];
  const constructorList = constructors.MRData?.StandingsTable?.StandingsLists?.[0];

  return {
    season: schedule.MRData?.RaceTable?.season || "current",
    standingsRound: driverList?.round || constructorList?.round || "",
    updatedAt: now.toISOString(),
    races: getUpcomingRaces(schedule.MRData?.RaceTable?.Races || [], now),
    drivers: mapDriverStandings(driverList?.DriverStandings || []),
    constructors: mapConstructorStandings(constructorList?.ConstructorStandings || []),
    source: "Jolpica F1 API",
  };
}
