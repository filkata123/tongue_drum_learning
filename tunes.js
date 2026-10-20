// Made-up tunes: exercises the app makes up fresh, so practising them means reading every note.
// The shaping rules come from #15: random never means uniform.
import { DRUM_NOTES } from "./notes.js";

// Listed under Exercises after the fixed ones, so Start's default stays a fixed exercise. A row is
// its tongues from low to high; a move's size is counted in places along the row.
export const MADE_UP_TUNES = [
  { id: "made-up-middle", title: "Made-up tune: middle row", row: ["1", "2", "3", "4", "5", "6", "7"] },
  { id: "made-up-whole", title: "Made-up tune: whole drum", row: DRUM_NOTES.map((n) => n.id) },
];

const STARTS = ["1", "3", "5"];

// One move to the next note: mostly a neighbour one or two places away, a bigger jump now and
// then (never more than half the row), and sometimes the same tongue again.
function move(random, half) {
  const r = random();
  const size = r < 0.1 ? 0
    : r < 0.85 ? 1 + Math.floor(random() * 2)
    : 3 + Math.floor(random() * (half - 2));
  return random() < 0.5 ? -size : size;
}

// Whether a drawn tune keeps every rule the drawing itself doesn't guarantee.
function shapely(places, row, half) {
  const tune = places.map((i) => row[i]);
  return tune.every(Boolean)
    && tune[3] !== "1" // the question doesn't sound finished
    && places.every((p, i) => i === 0 || Math.abs(p - places[i - 1]) <= half)
    && tune.every((tg, i) => i < 2 || tg !== tune[i - 1] || tg !== tune[i - 2]);
}

// An 8-note tune on a row, as tongue ids: two 4-note phrases, question and answer. It starts on
// 1, 3 or 5; the answer starts like the question and ends on 1. Draws are retried until every
// rule holds.
export function makeUpTune(row, random) {
  const half = Math.floor(row.length / 2);
  for (;;) {
    const places = [row.indexOf(STARTS[Math.floor(random() * STARTS.length)])];
    while (places.length < 4) places.push(places.at(-1) + move(random, half));
    places.push(places[0], places[1]);
    places.push(places.at(-1) + move(random, half));
    places.push(row.indexOf("1"));
    if (shapely(places, row, half)) return places.map((i) => row[i]);
  }
}
