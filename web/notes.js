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

export const MELODIES = [
  { name: "D major scale", notes: ["1", "2", "3", "4", "5", "6", "7", "˙1"] },
  { name: "Simple phrase", notes: ["3", "5", "6", "5", "3", "1", "2", "3"] },
  { name: "Up and down", notes: ["1", "3", "5", "7", "5", "3", "1"] },
  { name: "Classic step", notes: ["1", "1", "2", "3", "3", "2", "1"] },
  { name: "Full range", notes: ["_3", "_5", "1", "3", "5", "7", "˙2", "˙3"] },
  { name: "Upper octave", notes: ["˙1", "˙2", "˙3", "˙2", "˙1"] },
  { name: "Lower octave", notes: ["_3", "_4", "_5", "_6", "_7", "_6", "_5"] },
];

// Split a token into its digit and octave ("low" | "mid" | "high").
export function parseToken(id) {
  if (id.startsWith("_")) return { digit: id.slice(1), octave: "low" };
  if (id.startsWith("˙")) return { digit: id.slice(1), octave: "high" };
  return { digit: id, octave: "mid" };
}
