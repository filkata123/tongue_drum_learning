import { createPracticeCore } from "./core.js";
import { DRUM_MAP, DRUM_NOTES, NOTE_BY_ID, parseToken } from "./notes.js";
import { CONFIG, NoteListener } from "./pitch.js";

const params = new URLSearchParams(location.search);
const SIM = params.has("sim");     // play notes from the keyboard instead of the mic
const DEBUG = params.has("debug"); // show what the detector hears, live

const $ = (id) => document.getElementById(id);
const els = {
  start: $("start"), startBtn: $("start-btn"), startError: $("start-error"),
  play: $("play"), stage: $("stage"), hint: $("hint"), current: $("current"), next: [...$("next").children],
  pieceName: $("piece-name"), pieceTitle: $("piece-title"), piecePart: $("piece-part"), feedback: $("feedback"),
  debug: $("debug"), noteBars: $("note-bars"), simHint: $("sim-hint"), levelBar: $("level-bar"),
  done: $("done"), doneText: $("done-text"), restartBtn: $("restart-btn"),
  pieces: $("pieces"), piecesClose: $("pieces-close"), piecesGroups: $("pieces-groups"), addSong: $("add-song"),
  editor: $("editor"), editorTitle: $("editor-title"), editorClose: $("editor-close"), copyPrompt: $("copy-prompt"),
  songText: $("song-text"), songErrors: $("song-errors"), saveSong: $("save-song"),
};

const core = createPracticeCore({ storage: localStorage, clock: Date.now, random: Math.random });

function noteHtml(id, cls = "") {
  const { digit, octave } = parseToken(id);
  return `<span class="note ${octave}${cls}">${digit}</span>`;
}

// A step's tongues stacked top to bottom (melody over accompaniment); heard ones turn green.
const stepHtml = (step) => (step ? step.tongues.map((t) => noteHtml(t.id, t.heard ? " heard" : "")).join("") : "");

const GROUPS = { exercise: "Exercise", "my-song": "My song" };
const PARTS = { melody: "melody line", accomp: "accompaniment line", both: "both lines" };

// Draws a view snapshot from the core. The same snapshot comes back while nothing changes.
let shown = null;
function render(v) {
  if (v === shown) return;
  const before = shown;
  shown = v;

  const step = v.steps[v.position];
  els.pieceTitle.textContent = v.piece.title;
  els.piecePart.textContent = [GROUPS[v.piece.group], PARTS[v.piece.part]].filter(Boolean).join(" · ");
  els.current.innerHTML = stepHtml(step);
  // Always three next slots, so the step window never grows or shifts near the end.
  els.next.forEach((el, i) => { el.innerHTML = stepHtml(v.steps[v.position + 1 + i]); });

  if (JSON.stringify(v.hint) !== JSON.stringify(before?.hint)) renderHint(v.hint);

  if (!v.feedback) {
    els.stage.classList.remove("miss");
    els.feedback.textContent = "";
  } else if (v.feedback.seq !== before?.feedback?.seq) {
    els.stage.classList.remove("miss");
    void els.stage.offsetWidth; // restart the shake animation
    els.stage.classList.add("miss");
    els.feedback.innerHTML = `That was ${noteHtml(v.feedback.thatWas)}`;
  }

  els.done.hidden = !v.done;
  if (v.done) els.doneText.textContent = v.done.title;

  els.restartBtn.textContent = v.playing ? "Restart" : "Start";
  els.restartBtn.classList.toggle("start", !v.playing);
  if (v.playing !== before?.playing) keepAwake(v.playing);

  els.pieces.hidden = v.overlay?.kind !== "pieces";
  // Rebuilt only when the list itself changed, so a tap isn't lost to a re-render.
  if (!els.pieces.hidden && JSON.stringify(v.overlay) !== JSON.stringify(before?.overlay)) renderPieces(v.overlay);

  els.editor.hidden = v.overlay?.kind !== "editor";
  if (!els.editor.hidden) renderEditor(v.overlay, before?.overlay?.kind === "editor");
}

// The Location hint: the half of the drum map holding the target, with the target lit and a
// wrong tongue on that half marked.
function renderHint(hint) {
  if (!hint) {
    els.hint.replaceChildren();
    return;
  }
  const tongues = DRUM_NOTES.map(({ id }) => {
    const cls = hint.lit.includes(id) ? " lit" : id === hint.wrong ? " wrong" : "";
    const [x, y] = DRUM_MAP[id];
    return `<span class="tongue${cls}" style="left:${x}%;top:${y}%">${noteHtml(id)}</span>`;
  });
  els.hint.innerHTML = `<div class="half ${hint.half}"><div class="drum">${tongues.join("")}</div></div>`;
}

// The draft in the paste box is the screen's: the core only gives the starting text.
function renderEditor({ pieceId, text, errors }, wasOpen) {
  els.editorTitle.textContent = pieceId ? "Edit song" : "Add song";
  if (!wasOpen) {
    els.songText.value = text;
    els.copyPrompt.textContent = "Copy conversion prompt";
  }
  els.songErrors.replaceChildren(...errors.map((e) => {
    const li = document.createElement("li");
    li.textContent = e.message;
    return li;
  }));
}

function renderPieces({ groups }) {
  els.piecesGroups.replaceChildren(...groups.flatMap((g) => {
    const title = document.createElement("h2");
    title.textContent = g.title;
    if (!g.pieces.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nothing here yet.";
      return [title, empty];
    }
    return [title, ...g.pieces.map((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `piece${p.current ? " current" : ""}`;
      btn.textContent = p.title;
      btn.addEventListener("click", () => render(core.send({ type: "pick", pieceId: p.id })));
      if (!p.editable) return btn;
      // My songs: Edit reopens the saved text; Delete asks first (the confirm is the screen's).
      const row = document.createElement("div");
      row.className = "song-row";
      const edit = smallButton("Edit", `Edit ${p.title}`, () => render(core.send({ type: "open", what: "editor", pieceId: p.id })));
      const del = smallButton("Delete", `Delete ${p.title}`, () => {
        if (confirm(`Delete "${p.title}"? This can't be undone.`)) render(core.send({ type: "deleteSong", pieceId: p.id }));
      });
      row.append(btn, edit, del);
      return row;
    })];
  }));
}

function smallButton(text, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "song-action";
  btn.textContent = text;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", onClick);
  return btn;
}

els.pieceName.addEventListener("click", () => render(core.send({ type: "open", what: "pieces" })));
els.piecesClose.addEventListener("click", () => render(core.send({ type: "close" })));
els.addSong.addEventListener("click", () => render(core.send({ type: "open", what: "editor" })));
els.editorClose.addEventListener("click", () => render(core.send({ type: "close" })));
els.saveSong.addEventListener("click", () => render(core.send({ type: "saveSong", text: els.songText.value })));
els.copyPrompt.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shown.overlay.conversionPrompt);
    els.copyPrompt.textContent = "Copied ✓";
  } catch {
    els.copyPrompt.textContent = "Couldn't copy";
  }
});
els.restartBtn.addEventListener("click", () => render(core.send({ type: "start" })));

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
  let lastReport = ""; // debug: the last strike's three loudest tongues

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
        const t = (total / ctx.sampleRate) * 1000;
        const strike = listener.process(win, t);
        if (!strike) continue;
        // Move the onsets from audio time onto the core's clock.
        const now = Date.now();
        const clockAt = (at) => now - (t - at);
        const ranked = strike.ranked.map((r) => ({ ...r, at: clockAt(r.at) }));
        render(core.send({ type: "strike", tongue: strike.note.id, at: clockAt(strike.at), ranked }));
        if (DEBUG) {
          lastReport = `   last strike ${strike.note.id}: ` + strike.ranked.slice(0, 3)
            .map((r) => `${r.tongue} ${(20 * Math.log10(r.level)).toFixed(0)} dB ${r.at >= strike.at ? "+" : ""}${(r.at - strike.at).toFixed(0)} ms`)
            .join(" · ");
        }
      }
    }
  };

  const bars = DEBUG ? buildNoteBars() : null;
  function tick() {
    requestAnimationFrame(tick);
    render(core.send({ type: "tick" }));
    if (!listener.reading) return;
    const { level, notes, floors, heard } = listener.reading;
    els.levelBar.style.width = `${dbPercent(20 * Math.log10(level), -70, -10)}%`;
    if (DEBUG) {
      els.debug.textContent = `volume ${(20 * Math.log10(level)).toFixed(0)} dB   loudest ${heard ? heard.note.id : "—"}${lastReport}`;
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

// Keeps a phone screen from dimming while practising. The browser drops the lock when the page
// is hidden, so it's asked for again on return.
let wakeLock = null;
async function keepAwake(on) {
  if (!on) {
    wakeLock?.release();
    wakeLock = null;
    return;
  }
  if (wakeLock && !wakeLock.released) return;
  try { wakeLock = await navigator.wakeLock?.request("screen"); } catch { /* not supported or denied */ }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") keepAwake(shown?.playing);
});

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
  render(core.send({ type: "start" }));
});
