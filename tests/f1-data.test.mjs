import assert from "node:assert/strict";
import test from "node:test";

import {
  getUpcomingRaces,
  mapConstructorStandings,
  mapDriverStandings,
} from "../lib/f1-data.mjs";

test("selects the next two future F1 races", () => {
  const races = [
    {
      round: "1",
      raceName: "Past Grand Prix",
      date: "2026-06-01",
      time: "04:00:00Z",
      Circuit: { circuitName: "Past Circuit", Location: { locality: "Past", country: "Nowhere" } },
    },
    {
      round: "2",
      raceName: "Next Grand Prix",
      date: "2026-06-20",
      time: "14:00:00Z",
      Circuit: { circuitName: "Next Circuit", Location: { locality: "Next City", country: "Nextland" } },
    },
    {
      round: "3",
      raceName: "After Grand Prix",
      date: "2026-07-01",
      time: "15:00:00Z",
      Circuit: { circuitName: "After Circuit", Location: { locality: "After City", country: "Afterland" } },
    },
  ];

  assert.deepEqual(
    getUpcomingRaces(races, new Date("2026-06-10T00:00:00.000Z")),
    [
      {
        round: "2",
        raceName: "Next Grand Prix",
        circuitName: "Next Circuit",
        location: "Next City, Nextland",
        date: "2026-06-20",
        time: "14:00:00Z",
        startAt: "2026-06-20T14:00:00.000Z",
      },
      {
        round: "3",
        raceName: "After Grand Prix",
        circuitName: "After Circuit",
        location: "After City, Afterland",
        date: "2026-07-01",
        time: "15:00:00Z",
        startAt: "2026-07-01T15:00:00.000Z",
      },
    ],
  );
});

test("maps top three F1 driver standings", () => {
  const standings = [
    {
      position: "1",
      points: "156",
      Driver: { givenName: "Andrea Kimi", familyName: "Antonelli", code: "ANT" },
      Constructors: [{ name: "Mercedes" }],
    },
    {
      position: "2",
      points: "90",
      Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM" },
      Constructors: [{ name: "Ferrari" }],
    },
    {
      position: "3",
      points: "88",
      Driver: { givenName: "George", familyName: "Russell", code: "RUS" },
      Constructors: [{ name: "Mercedes" }],
    },
    {
      position: "4",
      points: "75",
      Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC" },
      Constructors: [{ name: "Ferrari" }],
    },
  ];

  assert.deepEqual(mapDriverStandings(standings), [
    { position: "1", name: "Andrea Kimi Antonelli", code: "ANT", team: "Mercedes", points: "156" },
    { position: "2", name: "Lewis Hamilton", code: "HAM", team: "Ferrari", points: "90" },
    { position: "3", name: "George Russell", code: "RUS", team: "Mercedes", points: "88" },
  ]);
});

test("maps top three F1 constructor standings", () => {
  const standings = [
    { position: "1", points: "244", Constructor: { name: "Mercedes" } },
    { position: "2", points: "165", Constructor: { name: "Ferrari" } },
    { position: "3", points: "118", Constructor: { name: "McLaren" } },
    { position: "4", points: "72", Constructor: { name: "Red Bull" } },
  ];

  assert.deepEqual(mapConstructorStandings(standings), [
    { position: "1", name: "Mercedes", points: "244" },
    { position: "2", name: "Ferrari", points: "165" },
    { position: "3", name: "McLaren", points: "118" },
  ]);
});
