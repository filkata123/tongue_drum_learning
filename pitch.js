import { DRUM_NOTES } from "./notes.js";

// Tuning knobs for note detection. If strikes are missed or doubled, these are the ones to adjust.
export const CONFIG = {
  windowSize: 8192,     // samples analysed per frame; long enough to tell neighbouring low notes apart
  onsetSize: 512,       // most recent samples (~10 ms) used to spot a sudden jump in volume
  minAmp: 0.0002,       // absolute floor (0..1); below this is silence even in a dead-quiet room
  noiseFactor: 30,      // a note must rise this many times above its learned background level
  noiseRiseRate: 0.005, // how fast the learned background level follows the room upward (per frame)
  noiseFallRate: 0.02,  // ...and downward; not instant, or brief quiet dips make it oversensitive
  onsetRatio: 1.6,      // volume strike = overall volume beats the loudest moment of the last peakMs by this much
  peakMs: 100,          // long enough to contain a full pulse of two neighbouring notes beating together
  noteOnsetRatio: 3,    // soft strike = another note's level jumps this much within attackMs
  attackMs: 40,         // a strike gets loud this fast; slower swells (a low note's wobble) aren't strikes
  onsetWindowMs: 200,   // how far back "before the strike" looks when measuring how much a note rose
  minRiseRatio: 2,      // a struck note must at least double in level; beats and wobbles don't
  neighbourCents: 250,  // notes this close (two tongues either side) can bleed into each other
  neighbourRatio: 3,    // a "strike" whose neighbour is this many times louder is just bleed or ring-along
  collectMs: 140,       // listen this long after a strike before deciding which note it was
  refractoryMs: 120,    // ignore new strikes this soon after the previous one
  subharmonicRatio: 0.1, // a lower note whose overtone won counts if it rose at least this fraction as much
};

export function rms(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// Each note is probed slightly flat, in tune and slightly sharp, since real drums drift.
const PROBE_CENTS = [-25, 0, 25];

// Measures how loud each drum note is in a buffer (Goertzel filters, Hann window).
// Levels are squared amplitudes: a pure sine of amplitude A at a note's pitch gives about A².
export class NoteMeter {
  constructor(sampleRate, size) {
    this.size = size;
    this.window = new Float32Array(size);
    for (let i = 0; i < size; i++) this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    this.coeffs = DRUM_NOTES.map((n) => PROBE_CENTS.map((cents) =>
      2 * Math.cos((2 * Math.PI * n.freq * Math.pow(2, cents / 1200)) / sampleRate)));
    this.scale = 4 / size; // Hann halves the amplitude, so 2/(N/2)
  }

  levels(buf) {
    const out = new Float64Array(this.coeffs.length);
    const n = this.size, w = this.window, off = buf.length - n;
    for (let k = 0; k < this.coeffs.length; k++) {
      for (const c of this.coeffs[k]) {
        let s1 = 0, s2 = 0;
        for (let i = 0; i < n; i++) {
          const s0 = buf[off + i] * w[i] + c * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        const power = (s1 * s1 + s2 * s2 - c * s1 * s2) * this.scale * this.scale;
        if (power > out[k]) out[k] = power;
      }
    }
    return out;
  }
}

// For each note, the other notes close enough in pitch to bleed into it.
const NEIGHBOURS = DRUM_NOTES.map((a, i) => DRUM_NOTES
  .map((b, j) => ({ j, cents: Math.abs(1200 * Math.log2(a.freq / b.freq)) }))
  .filter(({ j, cents }) => j !== i && cents <= CONFIG.neighbourCents)
  .map(({ j }) => j));

// For each note, the lower notes whose 2nd or 3rd overtone lands on it (e.g. low F# → middle F#).
const SUBHARMONICS = DRUM_NOTES.map((hi) => DRUM_NOTES
  .map((lo, j) => ({ lo, j }))
  .filter(({ lo }) => [2, 3].some((m) => Math.abs(1200 * Math.log2(hi.freq / (lo.freq * m))) < 35))
  .map(({ j }) => j));

// Turns a stream of audio frames into "a tongue was struck" events.
//
// A strike is spotted either by a jump in overall volume, or by one note suddenly getting
// much louder (a soft strike while other notes are still ringing). Then, a moment later,
// the note whose level rose the most is the one that was struck. Notes that were already
// ringing are fading, so they don't win even though they may still be the loudest.
//
// Thresholds are relative to a background level learned per note, so quiet microphones work,
// and so do mics that hear low notes much more weakly than high ones.
export class NoteListener {
  constructor(sampleRate, cfg = CONFIG) {
    this.cfg = cfg;
    this.meter = new NoteMeter(sampleRate, cfg.windowSize);
    this.history = []; // { t, level, notes } for the last onsetWindowMs
    this.lastOnset = -Infinity;
    this.collecting = null;
    this.lastNote = -1;     // index of the last note recognised
    this.noise = null;      // learned background level per note
    this.noiseLevel = null; // learned background overall volume
  }

  // Background estimate: follows the room slowly (faster down than up), and holds still while
  // a note is clearly sounding, so strikes and ringing notes don't raise it.
  // For roughly the first second it just averages, since the first frames may be empty.
  learnNoise(level, notes) {
    if (!this.noise) {
      this.noise = new Float64Array(notes.length);
      this.noiseLevel = 0;
      this.frames = 0;
    }
    this.frames++;
    const warmup = this.frames <= 60;
    const { noiseRiseRate: up, noiseFallRate: down, noiseFactor } = this.cfg;
    const follow = (n, x, freezeAbove) => {
      if (warmup) return n + (x - n) / this.frames;
      if (x < n) return n + (x - n) * down;
      return x < n * freezeAbove ? n + (x - n) * up : n;
    };
    for (let k = 0; k < notes.length; k++) this.noise[k] = follow(this.noise[k], notes[k], noiseFactor);
    this.noiseLevel = follow(this.noiseLevel, level, 3);
  }

  // Feed one frame (Float32Array, at least cfg.windowSize long) captured at time `t` (ms).
  // Returns { note, amp, at } when a strike is recognised, otherwise null; `at` is the strike's
  // onset, on the same timeline as `t`.
  // The latest per-frame reading is kept on `this.reading` for display.
  process(buf, t) {
    const cfg = this.cfg;
    const level = rms(buf.subarray(buf.length - cfg.onsetSize));
    const notes = this.meter.levels(buf);
    this.learnNoise(level, notes);
    const absFloor = cfg.minAmp * cfg.minAmp;
    const floors = Array.from(this.noise, (n) => Math.max(absFloor, n * cfg.noiseFactor));

    let loudest = 0;
    for (let k = 1; k < notes.length; k++) if (notes[k] > notes[loudest]) loudest = k;
    this.reading = {
      level,
      notes,
      floors,
      heard: notes[loudest] >= floors[loudest] ? { note: DRUM_NOTES[loudest], amp: Math.sqrt(notes[loudest]) } : null,
    };

    const recent = this.history.filter((h) => t - h.t <= cfg.onsetWindowMs);
    const before = new Float64Array(notes.length).fill(Infinity);
    const attackBefore = new Float64Array(notes.length).fill(Infinity);
    let levelPeak = 0;
    for (const h of recent) {
      const inAttack = t - h.t <= cfg.attackMs;
      if (t - h.t <= cfg.peakMs) levelPeak = Math.max(levelPeak, h.level);
      for (let k = 0; k < notes.length; k++) {
        before[k] = Math.min(before[k], h.notes[k]);
        if (inAttack) attackBefore[k] = Math.min(attackBefore[k], h.notes[k]);
      }
    }
    recent.push({ t, level, notes });
    this.history = recent;

    if (this.collecting) {
      if (t - this.collecting.start < cfg.collectMs) return null;
      const { start: at, before: base } = this.collecting;
      this.collecting = null;
      // Forget the quiet before this strike, or its own ring would look like a new jump.
      this.history = [{ t, level, notes }];

      const rise = notes.map((n, k) => n - base[k]);
      let best = -1;
      for (let k = 0; k < notes.length; k++) {
        const struck = rise[k] >= floors[k] && notes[k] >= base[k] * cfg.minRiseRatio;
        if (struck && (best === -1 || rise[k] > rise[best])) best = k;
      }
      if (best === -1) return null;
      // If the winner is an overtone of a lower note that also rose clearly, the lower note
      // was struck; the mic just hears its overtone better than its fundamental.
      for (const j of SUBHARMONICS[best]) {
        if (rise[j] >= floors[j] && rise[j] >= rise[best] * cfg.subharmonicRatio) {
          best = j;
          break;
        }
      }
      // A much louder neighbour means this note is only bleeding over from it or ringing along.
      if (NEIGHBOURS[best].some((j) => notes[j] > notes[best] * cfg.neighbourRatio)) return null;
      this.lastNote = best;
      return { note: DRUM_NOTES[best], amp: Math.sqrt(notes[best]), at };
    }

    if (t - this.lastOnset <= cfg.refractoryMs || recent.length < 2) return null;

    const volumeJump = level >= Math.max(cfg.minAmp, this.noiseLevel * 3) && level > levelPeak * cfg.onsetRatio;
    // The note just played is skipped while it rings: its level wobbles, so re-striking it
    // has to show up as a real jump in overall volume.
    let noteJump = false;
    for (let k = 0; k < notes.length && !noteJump; k++) {
      if (k === this.lastNote && notes[k] >= floors[k]) continue;
      noteJump = notes[k] >= floors[k] && notes[k] >= notes[loudest] * 0.1
        && notes[k] > attackBefore[k] * cfg.noteOnsetRatio;
    }
    if (volumeJump || noteJump) {
      this.collecting = { start: t, before };
      this.lastOnset = t;
    }
    return null;
  }
}
