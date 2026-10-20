// Song text: how every piece is written, built-in or pasted. One parser turns it into a piece.
//
//   title: Castle in the Sky
//   melody: 6/ 7/ | ˙1. 7/ ˙1 ˙3 | 7 - - 3 |
//   accomp: 0 | _6 3 6 3 | _5 2 5 2 |
//
// Notes 1–7, "_" lower, "˙" or "^" upper. A plain number is one beat; each "/" halves it, "."
// makes it half as long again, "-" holds one more beat. "0" is a rest and "|" a bar line.
import { DRUM_NOTES, NOTE_BY_ID } from "./notes.js";

// The marks, as the parser reads them and as the conversion prompt explains them.
const OCTAVE_MARKS = { "_": "lower", "˙": "upper", "^": "upper" }; // written before the number
const LENGTH_MARKS = { "/": 0.5, ".": 1.5 }; // written after the number; each multiplies its length

const anyOf = (marks) => Object.keys(marks).map((m) => `\\${m}`).join("");
// One symbol: a note or rest with its length marks, a hold, or a bar line.
const SYMBOL = new RegExp(`\\s*(?:([${anyOf(OCTAVE_MARKS)}]?)([0-7])([${anyOf(LENGTH_MARKS)}]*)|(-)|(\\|))\\s*`, "y");
// What's skipped when no symbol fits, so the rest of the line can still be checked.
const UNKNOWN = /\s*([^\s|]+)\s*/y;

const LINE_NAMES = { melody: "melody", accomp: "accompaniment" };

// "1 - 2/ 0 3" → { notes: [{ tongue, start, length, bar }], bars: [beats], unknown: [{ bar, symbol }] },
// in beats, bars counted from 1. Rests take time but aren't notes.
function readLine(text) {
  const notes = [], bars = [0], unknown = [];
  let at = 0;
  let last = null; // the note or rest a "-" holds on
  const bar = () => bars.length;
  SYMBOL.lastIndex = 0;
  while (SYMBOL.lastIndex < text.length) {
    const from = SYMBOL.lastIndex;
    const m = SYMBOL.exec(text);
    if (!m) {
      UNKNOWN.lastIndex = from;
      unknown.push({ bar: bar(), symbol: UNKNOWN.exec(text)[1] });
      SYMBOL.lastIndex = UNKNOWN.lastIndex;
      continue;
    }
    const [, octave, digit, marks, hold, barLine] = m;
    if (barLine) {
      bars.push(0);
      continue;
    }
    let length = 1;
    if (hold) {
      if (last) last.length += 1;
    } else {
      for (const mark of marks) length *= LENGTH_MARKS[mark];
      last = { tongue: `${OCTAVE_MARKS[octave] === "upper" ? "˙" : octave}${digit}`, start: at, length, bar: bar() };
      if (digit !== "0") notes.push(last);
    }
    at += length;
    bars[bars.length - 1] += length;
  }
  // A closing "|" doesn't start another bar.
  if (bars.length > 1 && bars[bars.length - 1] === 0 && /\|\s*$/.test(text)) bars.pop();
  return { notes, bars, unknown };
}

// Notes from the two lines that start at the same moment become one chord step, melody first.
// Both lines on the same tongue at once is one strike, so a single-tongue step.
function bothSteps(melody, accomp) {
  const byStart = new Map();
  for (const n of [...melody, ...accomp]) {
    if (!byStart.has(n.start)) byStart.set(n.start, []);
    const tongues = byStart.get(n.start);
    if (!tongues.includes(n.tongue)) tongues.push(n.tongue);
  }
  return [...byStart].sort(([a], [b]) => a - b).map(([start, tongues]) => ({ start, tongues }));
}

function readFields(text) {
  const fields = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(title|melody|accomp)\s*:(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

const beats = (n) => `${n} beat${n === 1 ? "" : "s"}`;

// Song text → every reason it can't be saved, as [{ bar, message }]; [] when it checks out.
// Whether the song sounds right isn't judged.
export function checkSongText(text) {
  const fields = readFields(text);
  const errors = [];
  const say = (bar, message) => errors.push({ bar, message: bar === null ? message : `bar ${bar}: ${message}` });
  if (!fields.title) say(null, "The title: line is missing");
  const lines = Object.keys(LINE_NAMES).filter((name) => fields[name] !== undefined)
    .map((name) => ({ name, ...readLine(fields[name]) }));
  for (const { notes } of lines) {
    for (const n of notes) if (!NOTE_BY_ID[n.tongue]) say(n.bar, `${n.tongue} isn't on the drum`);
  }
  for (const { name, unknown } of lines) {
    for (const u of unknown) say(u.bar, `"${u.symbol}" in the ${LINE_NAMES[name]} isn't a song text symbol`);
  }
  const [melody, accomp] = ["melody", "accomp"].map((name) => lines.find((l) => l.name === name));
  if (!melody?.notes.length) say(null, "The melody has no notes");
  else if (accomp) {
    for (let i = 0; i < Math.max(melody.bars.length, accomp.bars.length); i++) {
      const [m, a] = [melody.bars[i] ?? 0, accomp.bars[i] ?? 0];
      if (Math.abs(m - a) > 1e-9) say(i + 1, `melody ${beats(m)}, accompaniment ${a}`);
    }
  }
  return errors;
}

// Song text → { title, lines: { melody, accomp? }, both? }. Throws if it doesn't check out.
export function parseSongText(text) {
  const errors = checkSongText(text);
  if (errors.length) throw new Error(`Bad song text: ${errors.map((e) => e.message).join("; ")}`);
  const fields = readFields(text);
  const line = (name) => readLine(fields[name]).notes.map(({ tongue, start, length }) => ({ tongue, start, length }));
  const piece = { title: fields.title, lines: { melody: line("melody") } };
  if (fields.accomp !== undefined) {
    piece.lines.accomp = line("accomp");
    piece.both = bothSteps(piece.lines.melody, piece.lines.accomp);
  }
  return piece;
}

// Shown in the conversion prompt; it must save cleanly (the core tests check).
const EXAMPLE = `title: Ode to Joy
melody: 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2/ 2 - |
accomp: 1 - _5 - | 1 - _5 - | _6 - _5 - | 1 - _5 - |`;

// The song text rules, for any chatbot to turn a photo of a song sheet into song text.
export function conversionPrompt() {
  const octave = (word) => Object.keys(OCTAVE_MARKS).filter((m) => OCTAVE_MARKS[m] === word).map((m) => `"${m}"`).join(" or ");
  const length = (factor) => Object.keys(LENGTH_MARKS).find((m) => LENGTH_MARKS[m] === factor);
  const [half, longer] = [length(0.5), length(1.5)];
  return `Turn this tongue drum song sheet (numbered notation) into song text, following these rules exactly.

- The first line is "title:" and the song's name.
- The tune goes on one line starting "melody:". If the sheet has a second line underneath (an accompaniment, played at the same time), put it on a line starting "accomp:"; otherwise leave that line out.
- Notes are the numbers 1 to 7. A dot below a number is a lower note: write ${octave("lower")} before it (_5). A dot above is an upper note: write ${octave("upper")} before it (˙1 or ^1).
- Only these notes are on the drum: ${DRUM_NOTES.map((n) => n.id).join(" ")}.
- A plain number lasts one beat. Each "${half}" after it halves its length (one underline: 5${half}, two: 5${half}${half}). A "${longer}" after it (a dot beside the number) makes it half as long again.
- A "-" after a note holds it one more beat. "0" is a rest; it takes "${half}" and "${longer}" like a note.
- "|" is a bar line. Keep the sheet's bar lines. Each bar of the accompaniment must last as long as the same bar of the melody.
- Write repeats out in full. Put a space between symbols.

Example:

\`\`\`
${EXAMPLE}
\`\`\`

Output only the song text, nothing else.`;
}
