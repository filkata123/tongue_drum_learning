// Song text: how every piece is written, built-in or pasted. One parser turns it into a piece.
//
//   title: Castle in the Sky
//   melody: 6/ 7/ | ˙1. 7/ ˙1 ˙3 | 7 - - 3 |
//   accomp: 0 | _6 3 6 3 | _5 2 5 2 |
//
// Notes 1–7, "_" lower, "˙" or "^" upper. A plain number is one beat; each "/" halves it, "."
// makes it half as long again, "-" holds one more beat. "0" is a rest and "|" a bar line.

// One symbol: a note or rest with its length marks, a hold, or a bar line.
const SYMBOL = /\s*(?:([_˙^]?)([0-7])([/.]*)|(-)|(\|))\s*/y;

// "1 - 2/ 0 3" → [{ tongue, start, length }], in beats. Rests take time but aren't notes.
function parseLine(text) {
  const notes = [];
  let at = 0;
  let last = null; // the note or rest a "-" holds on
  SYMBOL.lastIndex = 0;
  while (SYMBOL.lastIndex < text.length) {
    const from = SYMBOL.lastIndex;
    const m = SYMBOL.exec(text);
    if (!m) throw new Error(`Unknown symbol in song text: "${text.slice(from).trim()}"`);
    const [, octave, digit, marks, hold, bar] = m;
    if (bar) continue;
    if (hold) {
      if (last) last.length += 1;
      at += 1;
      continue;
    }
    let length = 1;
    for (const mark of marks) length *= mark === "/" ? 0.5 : 1.5;
    last = { tongue: `${octave === "^" ? "˙" : octave}${digit}`, start: at, length };
    if (digit !== "0") notes.push(last);
    at += length;
  }
  return notes;
}

// Notes from the two lines that start at the same moment become one chord step, melody first.
function bothSteps(melody, accomp) {
  const byStart = new Map();
  for (const n of [...melody, ...accomp]) {
    if (!byStart.has(n.start)) byStart.set(n.start, []);
    byStart.get(n.start).push(n.tongue);
  }
  return [...byStart].sort(([a], [b]) => a - b).map(([start, tongues]) => ({ start, tongues }));
}

// Song text → { title, lines: { melody, accomp? }, both? }.
export function parseSongText(text) {
  const fields = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(title|melody|accomp)\s*:(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  const piece = { title: fields.title, lines: { melody: parseLine(fields.melody ?? "") } };
  if (fields.accomp !== undefined) {
    piece.lines.accomp = parseLine(fields.accomp);
    piece.both = bothSteps(piece.lines.melody, piece.lines.accomp);
  }
  return piece;
}
