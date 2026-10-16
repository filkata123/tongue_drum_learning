import { DRUM_NOTES, MELODIES, NOTE_BY_ID, parseToken } from "./notes.js";
import { CONFIG, NoteListener } from "./pitch.js";

const params = new URLSearchParams(location.search);
const SIM = params.has("sim");     // play notes from the keyboard instead of the mic
const DEBUG = params.has("debug"); // show what the detector hears, live

const $ = (id) => document.getElementById(id);
const els = {
  start: $("start"), startBtn: $("start-btn"), startError: $("start-error"),
  play: $("play"), stage: $("stage"), current: $("current"), next: $("next"),
  melodyName: $("melody-name"), progress: $("progress"), feedback: $("feedback"),
  debug: $("debug"), noteBars: $("note-bars"), simHint: $("sim-hint"), levelBar: $("level-bar"),
  done: $("done"), doneText: $("done-text"),
};

const STORAGE_KEY = "tongue-drum:melody";
const state = {
  melodyIdx: Number(localStorage.getItem(STORAGE_KEY)) % MELODIES.length || 0,
  step: 0,
  busy: false, // true during the hit/done animations, while input is ignored
};

function noteHtml(id) {
  const { digit, octave } = parseToken(id);
  return `<span class="note ${octave}">${digit}</span>`;
}

function render() {
  const melody = MELODIES[state.melodyIdx];
  els.melodyName.textContent = melody.name;
  els.current.innerHTML = noteHtml(melody.notes[state.step]);
  const nextId = melody.notes[state.step + 1];
  els.next.innerHTML = nextId ? noteHtml(nextId) : "✓";
  els.progress.innerHTML = melody.notes
    .map((_, i) => `<span class="dot ${i < state.step ? "done" : i === state.step ? "now" : ""}"></span>`)
    .join("");
}

function onStrike(heard) {
  if (state.busy) return;
  const target = MELODIES[state.melodyIdx].notes[state.step];

  if (heard.note.id === target) {
    els.feedback.textContent = "";
    els.stage.classList.remove("miss");
    els.stage.classList.add("hit");
    state.busy = true;
    setTimeout(advance, 250);
  } else {
    els.stage.classList.remove("miss");
    void els.stage.offsetWidth; // restart the shake animation
    els.stage.classList.add("miss");
    els.feedback.innerHTML = `That was ${noteHtml(heard.note.id)}`;
  }
}

function advance() {
  els.stage.classList.remove("hit", "miss");
  const melody = MELODIES[state.melodyIdx];
  state.step++;
  if (state.step < melody.notes.length) {
    state.busy = false;
    render();
    return;
  }

  els.doneText.textContent = melody.name;
  els.done.hidden = false;
  setTimeout(() => {
    state.melodyIdx = (state.melodyIdx + 1) % MELODIES.length;
    state.step = 0;
    localStorage.setItem(STORAGE_KEY, state.melodyIdx);
    els.done.hidden = true;
    state.busy = false;
    render();
  }, 1500);
}

// --- Audio ---------------------------------------------------------------

async function openInput(ctx) {
  if (SIM) {
    const input = ctx.createGain();
    input.connect(ctx.destination); // so you can hear the simulated drum
    setupSimKeys(ctx, input);
    return input;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    // Phone/laptop voice processing treats a ringing note as noise and squashes it.
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  return ctx.createMediaStreamSource(stream);
}

// Feeds the detector a frame every `hop` samples (~60 per second) of continuous audio.
// Timing comes from the sample count, so a busy or slow device doesn't skip audio.
async function listen(ctx, input) {
  await ctx.audioWorklet.addModule("capture.js");
  const capture = new AudioWorkletNode(ctx, "capture");
  input.connect(capture);
  capture.connect(ctx.destination); // outputs silence; connected so the browser keeps it running

  const listener = new NoteListener(ctx.sampleRate);
  if (DEBUG) window.listener = listener; // for poking at from the console
  const win = new Float32Array(CONFIG.windowSize);
  const hop = Math.round(ctx.sampleRate / 60);
  let sinceHop = 0, total = 0;

  capture.port.onmessage = ({ data }) => {
    let block = data;
    while (block.length) {
      const take = Math.min(block.length, hop - sinceHop);
      win.copyWithin(0, take);
      win.set(block.subarray(0, take), win.length - take);
      block = block.subarray(take);
      sinceHop += take;
      total += take;
      if (sinceHop === hop) {
        sinceHop = 0;
        const strike = listener.process(win, (total / ctx.sampleRate) * 1000);
        if (strike) onStrike(strike);
      }
    }
  };

  const bars = DEBUG ? buildNoteBars() : null;
  function tick() {
    requestAnimationFrame(tick);
    if (!listener.reading) return;
    const { level, notes, floors, heard } = listener.reading;
    els.levelBar.style.width = `${dbPercent(20 * Math.log10(level), -70, -10)}%`;
    if (DEBUG) {
      els.debug.textContent = `volume ${(20 * Math.log10(level)).toFixed(0)} dB   loudest ${heard ? heard.note.id : "—"}`;
      notes.forEach((p, k) => {
        bars[k].bar.style.height = `${dbPercent(10 * Math.log10(p), -110, -20)}%`;
        bars[k].floor.style.bottom = `${dbPercent(10 * Math.log10(floors[k]), -110, -20)}%`;
        bars[k].bar.classList.toggle("above", p >= floors[k]);
      });
    }
  }
  tick();
}

// Maps a dB value onto 0–100% between lo and hi.
function dbPercent(db, lo, hi) {
  return Math.max(0, Math.min(100, ((db - lo) / (hi - lo)) * 100));
}

// Debug view: one bar per tongue showing how loud the mic hears it, with a line at the
// level it has to pass to count. Bars turn green above the line.
function buildNoteBars() {
  els.noteBars.hidden = false;
  return DRUM_NOTES.map((n) => {
    const col = document.createElement("div");
    col.className = "col";
    col.innerHTML = `<div class="track"><div class="bar"></div><div class="floor"></div></div><div class="label">${noteHtml(n.id)}</div>`;
    els.noteBars.append(col);
    return { bar: col.querySelector(".bar"), floor: col.querySelector(".floor") };
  });
}

// Sim mode: a crude decaying-tone "drum" played from the keyboard.
const SIM_KEYS = {
  z: "_3", x: "_4", c: "_5", v: "_6", b: "_7",
  1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "˙1", 9: "˙2", 0: "˙3",
};

function setupSimKeys(ctx, out) {
  window.addEventListener("keydown", (e) => {
    const id = SIM_KEYS[e.key.toLowerCase()];
    if (!id || e.repeat) return;
    const f = NOTE_BY_ID[id].freq;
    const now = ctx.currentTime;
    for (const [mult, amp] of [[1, 0.3], [2, 0.06], [3, 0.03]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f * mult;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(gain).connect(out);
      osc.start(now);
      osc.stop(now + 1.9);
    }
  });
}

// Keep a phone screen from dimming mid-practice.
async function keepAwake() {
  try { await navigator.wakeLock?.request("screen"); } catch { /* not supported or denied */ }
}

els.startBtn.addEventListener("click", async () => {
  els.startError.hidden = true;
  try {
    const ctx = new AudioContext();
    await ctx.resume();
    const input = await openInput(ctx);
    await listen(ctx, input);
  } catch (err) {
    els.startError.textContent = window.isSecureContext
      ? `Couldn't open the microphone (${err.name || err}). Check that the browser is allowed to use it.`
      : "The microphone only works over https:// or on localhost.";
    els.startError.hidden = false;
    return;
  }
  els.start.hidden = true;
  els.play.hidden = false;
  els.debug.hidden = !DEBUG;
  els.simHint.hidden = !SIM;
  render();
  keepAwake();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") keepAwake();
  });
});
