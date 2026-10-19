// Throwaway experiment: guided recording of chords on the real drum, with a live chord reading.
// Mic mode:    chord-record.html                       records, shows what it heard, saves .wav + .json
// Replay mode: chord-record.html?replay=<name>         re-runs recordings/<name>.wav against recordings/<name>.json
import { DRUM_NOTES, parseToken } from "./notes.js";
import { CONFIG, NoteListener, NoteMeter } from "./pitch.js";

const $ = (id) => document.getElementById(id);
const REPLAY = new URLSearchParams(location.search).get("replay");

// --- What to strike --------------------------------------------------------

const SINGLES = ["_3", "_6", "1", "5", "˙1"];
const PAIRS = [
  ["octave", "_3", "3"], ["octave", "_6", "6"], ["octave", "1", "˙1"], ["octave", "3", "˙3"],
  ["overtone", "_3", "7"], ["overtone", "_4", "˙1"],
  ["wide", "1", "5"], ["wide", "_5", "3"], ["wide", "2", "6"],
  ["neighbour", "1", "2"], ["neighbour", "5", "6"], ["neighbour", "_3", "_4"],
];
const REPEATS = 3;
const PLAN = [
  ...SINGLES.flatMap((id) => [0, 1].map(() => ({ kind: "single", cond: "single", notes: [id] }))),
  ...PAIRS.flatMap(([kind, a, b]) => ["even", "right softer"].flatMap((cond) =>
    Array.from({ length: REPEATS }, () => ({ kind, cond, notes: [a, b] })))),
];

// --- Chord reading ---------------------------------------------------------

const ATTEMPT_MS = 500; // every strike within this long of the first one belongs to the same attempt
const LOCKOUT_MS = 700; // after an attempt, strikes are ignored this long (counted as extra onsets)
const WARMUP_MS = 1500; // the detector spends about the first second learning the room's background

const cents = (a, b) => Math.abs(1200 * Math.log2(DRUM_NOTES[a].freq / DRUM_NOTES[b].freq));
const isOvertone = (lo, hi) => [2, 3].some((m) =>
  Math.abs(1200 * Math.log2(DRUM_NOTES[hi].freq / (DRUM_NOTES[lo].freq * m))) < 35);

// Same chord reading as chord-probe.html: every note that passes the detector's own "was struck"
// test when it decides on a strike, minus obvious overtones and bleed, with how much it rose.
function chordReading(l, base) {
  const { notes, floors } = l.reading;
  const rise = Array.from(notes, (n, k) => n - base[k]);
  let struck = rise.map((r, k) => (r >= floors[k] && notes[k] >= base[k] * CONFIG.minRiseRatio ? k : -1)).filter((k) => k >= 0);
  struck = struck.filter((k) => !struck.some((j) => j !== k && isOvertone(j, k) && rise[k] < rise[j] * 0.3));
  struck = struck.filter((k) => !struck.some((j) => j !== k && cents(j, k) <= CONFIG.neighbourCents && notes[j] > notes[k] * CONFIG.neighbourRatio));
  return struck.map((k) => ({ id: DRUM_NOTES[k].id, rise: rise[k] }));
}

// Wraps the detector and groups its strikes into attempts. feed() returns an attempt once it's over.
class ChordProbe {
  constructor(sampleRate) {
    this.l = new NoteListener(sampleRate);
    this.open = null;
    this.lockUntil = -Infinity;
    this.last = null;
  }

  feed(win, t) {
    const pending = this.l.collecting;
    const event = this.l.process(win, t);
    const onset = !pending && this.l.collecting;
    if (onset && !this.open) {
      if (t < this.lockUntil) { if (this.last) this.last.extraOnsets++; }
      else this.open = { t, onsets: 0, events: [], heard: {} };
    }
    if (!this.open) return null;
    if (onset) this.open.onsets++;
    if (event) this.open.events.push(event.note.id);
    if (pending && !this.l.collecting) {
      for (const { id, rise } of chordReading(this.l, pending.before)) this.open.heard[id] = Math.max(this.open.heard[id] || 0, rise);
    }
    if (t - this.open.t < ATTEMPT_MS || this.l.collecting) return null;
    const done = { ...this.open, extraOnsets: 0 };
    this.open = null;
    // An onset with no note behind it (ring-along wobble, room noise, the first second while the
    // detector learns the room) isn't a strike: keep waiting for the real one.
    if (!done.events.length && !Object.keys(done.heard).length || done.t < WARMUP_MS) {
      if (this.last) this.last.extraOnsets++;
      return null;
    }
    this.lockUntil = t + LOCKOUT_MS;
    this.last = done;
    return done;
  }
}

// Notes whose rise is at least x times the biggest rise in the attempt.
function readAt(heard, x) {
  const top = Math.max(0, ...Object.values(heard));
  return Object.keys(heard).filter((id) => heard[id] >= top * x);
}
const sameSet = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

// --- Summary ---------------------------------------------------------------

const XS = [0.01, 0.03, 0.1, 0.3];
const pct = (x, n) => (n ? `${Math.round((100 * x) / n)}%` : "—").padStart(6);

function summary(results) {
  const done = results.filter((r) => r.attempt);
  const NL = "\n";
  let s = `${done.length} strikes recorded. "x": a note counts if its rise is at least x times the biggest rise.` + NL + NL;
  s += `${"group".padEnd(26)}   n  exactly the struck notes, by x${" ".repeat(4)}today's detector picked one of them` + NL;
  s += `${"".padEnd(30)}${XS.map((x) => String(x).padStart(6)).join("")}` + NL;
  const groups = {};
  for (const r of done) (groups[`${r.kind}, ${r.cond}`] ||= []).push(r);
  for (const [name, rs] of Object.entries(groups)) {
    const right = rs.filter((r) => r.attempt.events.length >= 1 && r.notes.includes(r.attempt.events[0])).length;
    s += `${name.padEnd(26)}${String(rs.length).padStart(4)}${XS.map((x) => pct(rs.filter((r) => sameSet(readAt(r.attempt.heard, x), r.notes)).length, rs.length)).join("")}${pct(right, rs.length)}` + NL;
  }
  const extra = done.filter((r) => r.attempt.extraOnsets > 0).length;
  const ignored = results.reduce((a, r) => a + (r.ignored?.length || 0), 0);
  s += NL + `Strikes followed by a stray onset (ringing, noise, or a strike while the next prompt wasn't up): ${extra}/${done.length}` + NL;
  s += `Sounds ignored because they held none of the asked-for notes: ${ignored}` + NL;
  s += NL + "EVERY STRIKE (struck → heard, rise relative to the biggest; detector events)" + NL;
  for (const r of done) {
    const top = Math.max(0, ...Object.values(r.attempt.heard));
    const heard = Object.entries(r.attempt.heard).sort((a, b) => b[1] - a[1]).map(([id, v]) => `${id}(${(v / top).toFixed(2)})`).join(" ");
    s += `  ${r.notes.join("+").padEnd(7)} ${r.cond.padEnd(13)} → ${heard || "nothing"}   [${r.attempt.events.join(",")}]${r.attempt.extraOnsets ? `  +${r.attempt.extraOnsets} stray` : ""}` + NL;
  }
  return s;
}

// --- Audio plumbing ----------------------------------------------------------

// Feeds the probe a frame every `hop` samples of continuous audio, as app.js does.
function framer(sampleRate, onFrame) {
  const win = new Float32Array(CONFIG.windowSize);
  const hop = Math.round(sampleRate / 60);
  let sinceHop = 0, total = 0;
  return (block) => {
    while (block.length) {
      const take = Math.min(block.length, hop - sinceHop);
      win.copyWithin(0, take);
      win.set(block.subarray(0, take), win.length - take);
      block = block.subarray(take);
      sinceHop += take;
      total += take;
      if (sinceHop === hop) { sinceHop = 0; onFrame(win, (total / sampleRate) * 1000); }
    }
  };
}

function wavBlob(chunks, sampleRate) {
  const n = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); buf.setUint32(4, 36 + n * 2, true); str(8, "WAVEfmt ");
  buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
  buf.setUint32(24, sampleRate, true); buf.setUint32(28, sampleRate * 2, true);
  buf.setUint16(32, 2, true); buf.setUint16(34, 16, true); str(36, "data"); buf.setUint32(40, n * 2, true);
  let o = 44;
  for (const c of chunks) for (let i = 0; i < c.length; i++, o += 2) buf.setInt16(o, c[i], true);
  return new Blob([buf], { type: "audio/wav" });
}

function readWav(arrayBuf) {
  const v = new DataView(arrayBuf);
  let o = 12, sampleRate = 48000;
  while (o < v.byteLength) {
    const id = String.fromCharCode(...new Uint8Array(arrayBuf, o, 4)), size = v.getUint32(o + 4, true);
    if (id === "fmt ") sampleRate = v.getUint32(o + 12, true);
    if (id === "data") {
      const out = new Float32Array(size / 2);
      for (let i = 0; i < out.length; i++) out[i] = v.getInt16(o + 8 + i * 2, true) / 32768;
      return { sampleRate, samples: out };
    }
    o += 8 + size + (size % 2);
  }
  throw new Error("no data chunk in wav");
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

// --- Mic mode ------------------------------------------------------------------

const noteHtml = (id) => { const { digit, octave } = parseToken(id); return `<span class="note ${octave}">${digit}</span>`; };
const results = PLAN.map((p) => ({ ...p, attempt: null }));
let step = 0, sampleRate = 48000;
const chunks = [];

function showPrompt() {
  if (step >= PLAN.length) return finish();
  const p = PLAN[step];
  $("count").textContent = `${step + 1} / ${PLAN.length}`;
  $("pair").innerHTML = p.notes.map(noteHtml).join(" + ");
  $("how").textContent = p.cond === "single" ? "just this one" : p.cond === "even" ? "together, both equally hard" : "together, the right one softer";
}

function onAttempt(attempt) {
  if (step >= PLAN.length || $("pair").textContent === "…") return;
  const heard = readAt(attempt.heard, 0.1);
  // Hearing none of the asked-for notes is almost always noise or ringing, not the strike: keep waiting.
  if (!Object.keys(attempt.heard).some((id) => PLAN[step].notes.includes(id))) {
    (results[step].ignored ||= []).push(attempt);
    $("heard").className = "bad";
    $("heard").innerHTML = `ignored a sound (${heard.map(noteHtml).join(" + ") || "no note"}), still waiting`;
    return;
  }
  results[step].attempt = attempt;
  const ok = sameSet(heard, PLAN[step].notes);
  $("heard").className = ok ? "ok" : "bad";
  $("heard").innerHTML = `heard ${heard.map(noteHtml).join(" + ") || "nothing"}`;
  step++;
  // Strikes during the lockout aren't counted, so only ask for the next one once it's over.
  $("pair").textContent = "…";
  $("how").textContent = "";
  setTimeout(showPrompt, LOCKOUT_MS);
}

function finish() {
  step = PLAN.length;
  $("prompt").hidden = true;
  $("saves").hidden = false;
  $("summary").textContent = summary(results);
}

$("redo").onclick = () => { if (step > 0) { step--; results[step].attempt = null; $("heard").textContent = "redo:"; showPrompt(); } };
$("skip").onclick = () => { step++; showPrompt(); };
$("finish").onclick = finish;
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
$("save-wav").onclick = () => download(wavBlob(chunks, sampleRate), `chords-${stamp}.wav`);
$("save-json").onclick = () => download(new Blob([JSON.stringify({ sampleRate, results }, null, 1)], { type: "application/json" }), `chords-${stamp}.json`);

$("start").onclick = async () => {
  const ctx = new AudioContext();
  await ctx.resume();
  sampleRate = ctx.sampleRate;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  await ctx.audioWorklet.addModule("capture.js");
  const capture = new AudioWorkletNode(ctx, "capture");
  ctx.createMediaStreamSource(stream).connect(capture);
  capture.connect(ctx.destination);
  const probe = new ChordProbe(sampleRate);
  const feed = framer(sampleRate, (win, t) => { const a = probe.feed(win, t); if (a) onAttempt(a); });
  capture.port.onmessage = ({ data }) => {
    chunks.push(Int16Array.from(data, (x) => Math.max(-32768, Math.min(32767, Math.round(x * 32767)))));
    feed(data);
  };
  $("start").hidden = true;
  $("intro").hidden = true;
  $("prompt").hidden = false;
  showPrompt();
};

// --- Replay mode ------------------------------------------------------------------

async function replay(name) {
  $("intro").textContent = `Replaying recordings/${name}.wav`;
  $("start").hidden = true;
  const saved = await (await fetch(`recordings/${name}.json`)).json();
  const { sampleRate: sr, samples } = readWav(await (await fetch(`recordings/${name}.wav`)).arrayBuffer());
  const probe = new ChordProbe(sr);
  const attempts = [];
  const feed = framer(sr, (win, t) => { const a = probe.feed(win, t); if (a) attempts.push(a); });
  for (let i = 0; i < samples.length; i += 1024) feed(samples.subarray(i, i + 1024));
  // Match each saved strike to the replayed attempt that started at (nearly) the same time.
  const replayed = saved.results.map((r) => ({
    ...r, attempt: r.attempt && (attempts.find((a) => Math.abs(a.t - r.attempt.t) < 100) || { t: r.attempt.t, onsets: 0, events: [], heard: {}, extraOnsets: 0 }),
  }));
  $("summary").textContent = targetCheck(replayed, samples, sr) + "\n\n" + summary(replayed);
  window.replayed = replayed;
}

// Step mode knows which two tongues to expect, so it only has to ask "are those two the loudest?".
// Also reports how much of the recording is exact digital silence (a mic driver muting quiet input).
function targetCheck(rs, samples, sr) {
  const N = CONFIG.windowSize, meter = new NoteMeter(sr, N);
  const idx = Object.fromEntries(DRUM_NOTES.map((n, k) => [n.id, k]));
  const tally = {};
  for (const r of rs) {
    if (!r.attempt || r.notes.length < 2) continue;
    const end = Math.round(((r.attempt.t + 200) / 1000) * sr);
    const lv = meter.levels(samples.subarray(end - N, end));
    const exp = r.notes.map((id) => idx[id]);
    const otherMax = Math.max(...Array.from(lv).filter((_, k) => !exp.includes(k)));
    const margin = 10 * Math.log10(Math.min(...exp.map((k) => lv[k])) / otherMax);
    const t = (tally[`${r.kind}, ${r.cond}`] ||= { n: 0, ok: 0, margins: [] });
    t.n++;
    if (margin > 0) t.ok++;
    t.margins.push(margin);
  }
  const zeros = samples.reduce((a, x) => a + (x === 0), 0);
  let s = `Exact digital silence: ${Math.round((100 * zeros) / samples.length)}% of the recording` + "\n\n";
  s += "TARGET CHECK, 200 ms after the strike: both struck tongues are the two loudest  (median margin of the softer one over the loudest other tongue)\n";
  for (const [k, t] of Object.entries(tally)) {
    const med = t.margins.sort((a, b) => a - b)[Math.floor(t.margins.length / 2)];
    s += `  ${k.padEnd(26)}${`${t.ok}/${t.n}`.padStart(6)}   ${med.toFixed(0).padStart(3)} dB\n`;
  }
  return s;
}
if (REPLAY) replay(REPLAY);
