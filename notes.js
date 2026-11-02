// The 15 tongues of a 13" D major tongue drum, low F# to high F#.
// Tokens use the same notation as the Python app: "_" = lower octave, "˙" = upper octave.
export const DRUM_NOTES = [
  { id: "_3", midi: 54 }, // F#3
  { id: "_4", midi: 55 }, // G3
  { id: "_5", midi: 57 }, // A3
  { id: "_6", midi: 59 }, // B3
  { id: "_7", midi: 61 }, // C#4
  { id: "1", midi: 62 },  // D4
  { id: "2", midi: 64 },  // E4
  { id: "3", midi: 66 },  // F#4
  { id: "4", midi: 67 },  // G4
  { id: "5", midi: 69 },  // A4
  { id: "6", midi: 71 },  // B4
  { id: "7", midi: 73 },  // C#5
  { id: "˙1", midi: 74 }, // D5
  { id: "˙2", midi: 76 }, // E5
  { id: "˙3", midi: 78 }, // F#5
].map((n) => ({ ...n, freq: 440 * Math.pow(2, (n.midi - 69) / 12) }));

export const NOTE_BY_ID = Object.fromEntries(DRUM_NOTES.map((n) => [n.id, n]));

// The drum map: where each tongue sits on the real drum, as [x%, y%] of the drum, with the player
// at the bottom. Tongue centres were read off the learner's photo (in its pixels, the drum's centre
// at 552,352 with radii 422 × 328) on the prototype/main-screen branch, as confirmed in #17.
const PHOTO = {
  "˙3": [553, 50], "˙2": [325, 125], "2": [450, 95], "3": [655, 95], "˙1": [780, 125],
  "_7": [330, 205], "1": [800, 205], "_3": [556, 240], "7": [230, 310], "6": [880, 310],
  "_5": [330, 400], "_6": [790, 390], "_4": [560, 490], "5": [400, 535], "4": [720, 530],
};
export const DRUM_MAP = Object.fromEntries(Object.entries(PHOTO).map(([id, [x, y]]) =>
  [id, [50 + ((x - 552) / 422) * 45, 50 + ((y - 352) / 328) * 45]]));

// The half of the drum a tongue sits in: "left" or "right" as the player sees it. The centre
// tongues fall just right of the middle line; the hint shows ~65% of the drum, so they're never cut.
export const halfOf = (id) => (DRUM_MAP[id][0] <= 50 ? "left" : "right");

// The built-in exercises, written in song text (see songtext.js). Read-only; only exercises and
// public-domain or made-up tunes belong here, since the repo is public.
export const EXERCISES = [
  { id: "d-major-scale", text: "title: D major scale\nmelody: 1 2 3 4 5 6 7 ˙1" },
  { id: "simple-phrase", text: "title: Simple phrase\nmelody: 3 5 6 5 3 1 2 3" },
  { id: "up-and-down", text: "title: Up and down\nmelody: 1 3 5 7 5 3 1" },
  { id: "classic-step", text: "title: Classic step\nmelody: 1 1 2 3 3 2 1" },
  { id: "full-range", text: "title: Full range\nmelody: _3 _5 1 3 5 7 ˙2 ˙3" },
  { id: "upper-octave", text: "title: Upper octave\nmelody: ˙1 ˙2 ˙3 ˙2 ˙1" },
  { id: "lower-octave", text: "title: Lower octave\nmelody: _3 _4 _5 _6 _7 _6 _5" },
  // Two-line exercises: a melody over a low accompaniment.
  {
    id: "twinkle-two-lines",
    text: `title: Twinkle, twinkle (two lines)
melody: 1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - |
accomp: _5 - 3 - | 4 - 3 - | _4 - _6 - | _5 - _3 - |`,
  },
  {
    id: "ode-to-joy-two-lines",
    text: `title: Ode to Joy (two lines)
melody: 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2/ 2 - |
accomp: 1 - _5 - | 1 - _5 - | _6 - _5 - | 1 - _5 - |`,
  },
  {
    id: "bells-two-lines",
    text: `title: Bells (two lines)
melody: 5 - 3 - | 5 3 1 - |
accomp: 1 0 _5 0 | 1 - _5 - |`,
  },
];

// Split a token into its digit and octave ("low" | "mid" | "high").
export function parseToken(id) {
  if (id.startsWith("_")) return { digit: id.slice(1), octave: "low" };
  if (id.startsWith("˙")) return { digit: id.slice(1), octave: "high" };
  return { digit: id, octave: "mid" };
}
