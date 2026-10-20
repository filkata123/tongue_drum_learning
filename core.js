// The practice core: every Step mode and Timed mode rule, with no DOM, mic or audio output.
// The screen turns DOM events and detector strikes into commands and renders the view that
// send() returns. See docs/adr/0001-practice-core-single-send-and-view-snapshot.md.
import { DRUM_NOTES, EXERCISES, halfOf } from "./notes.js";
import { checkSongText, conversionPrompt, parseSongText } from "./songtext.js";
import { MADE_UP_TUNES, makeUpTune } from "./tunes.js";

const HIT_FLASH_MS = 250; // the right tongue shows green this long before moving on
const DONE_MS = 1500;      // "done" shows this long before the piece starts again
const HINT_MISSES = 2;     // the Location hint appears after this many misses on a step…
const HINT_IDLE_MS = 5000; // …or after this long with no strike, whichever comes first
const FADE_HITS = 3;       // after this many unaided hits in a row, a tongue's hint retires
const CHORD_MS = 100;      // a chord's tongues must each start sounding this close to the strike
const RING_ON_MS = 1500;   // the step just played may still ring this long after it was hit
const DEFAULT_TEMPO = 60;  // a piece's tempo in beats per minute, until it rises or is set
const TEMPOS = { min: 40, max: 160, step: 5 }; // a piece's tempo, the gear's −/+ and each rise
const RISE_AT = 0.9;       // on Auto, a Timed run with this share of notes on time raises the tempo
const LISTEN_SPEEDS = TEMPOS; // Listen's −/+, in beats per minute
const COUNT_IN = 4;        // a Timed run counts in with this many clicks, a beat apart
const LATE_MS = 300;       // a strike can reach the core this long after its onset and still count

// Every exercise goes through the same parser as a pasted song.
const EXERCISE_PIECES = EXERCISES.map(({ id, text }) => ({ id, group: "exercise", ...parseSongText(text) }));
// The made-up tunes come after them. Listed, a made-up tune is only its row; the tune itself is
// made up fresh whenever it's picked or finished (see `practise`).
const ALL_EXERCISES = [...EXERCISE_PIECES, ...MADE_UP_TUNES.map((t) => ({ ...t, group: "exercise" }))];

// A two-line piece is taught in three parts, in this order. A one-line piece has no part (null).
const partsOf = (piece) => (piece.lines.accomp?.length ? ["melody", "accomp", "both"] : [null]);

// The notes a part sounds, in time order: [{ tongue, start, length }], in beats. Both lines sound
// every note of either line.
function notesOf(piece, part) {
  if (part === "both") return [...piece.lines.melody, ...piece.lines.accomp].sort((a, b) => a.start - b.start);
  return piece.lines[part === "accomp" ? "accomp" : "melody"];
}

// Step mode's steps in a part: each step is the tongues struck together, melody first.
function stepsOf(piece, part) {
  if (part === "both") return piece.both.map((s) => s.tongues);
  return notesOf(piece, part).map((n) => [n.tongue]);
}

// The beat each of the part's steps starts on.
const stepStarts = (piece, part) => (part === "both" ? piece.both : notesOf(piece, part)).map((s) => s.start);

const PIECE_KEY = "tongue-drum:piece"; // the id of the piece last picked
const SONGS_KEY = "tongue-drum:songs"; // My songs: [{ id, text }], in the order they were added
const FADE_KEY = "tongue-drum:fade";   // unaided hits in a row, per tongue: { [tongue]: count }
const PARTS_KEY = "tongue-drum:parts"; // { [pieceId]: part }, for two-line pieces past their first part
const HINTS_KEY = "tongue-drum:hints"; // the gear's "Location hints" switch: true | false
const TIMED_KEY = "tongue-drum:timed"; // the "Timed" switch beside Start: true | false
// Cold-run scores: { [pieceId]: { [part]: { [day]: [hits, steps] } } }; a one-line piece's go under "melody"
const SCORES_KEY = "tongue-drum:scores";
// Made-up tune scores, latest last: { [exerciseId]: [[hits, steps], …] }, at most RECENT_TUNES each
const TUNES_KEY = "tongue-drum:tunes";
// Each piece's tempo: { [pieceId]: { bpm, locked } }; a piece with none saved is at DEFAULT_TEMPO, on Auto
const TEMPOS_KEY = "tongue-drum:tempo";
const RECENT_TUNES = 10; // a made-up tune's average is over this many of its latest runs

// The local calendar day of a clock time, as "2026-10-20", so days sort as text.
function dayOf(ms) {
  const d = new Date(ms);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("-");
}

const mySong = ({ id, text }) => ({ id, group: "my-song", text, ...parseSongText(text) });

// My songs as saved. Anything corrupt is left out rather than breaking the app.
function loadSongs(storage) {
  let saved;
  try { saved = JSON.parse(storage.getItem(SONGS_KEY)); } catch { return []; }
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((s) => {
    try { return [mySong(s)]; } catch { return []; }
  });
}

// A stored { key: value } object. Anything corrupt means an empty one.
function loadObject(storage, key) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

// The "Location hints" switch as saved. Anything but a saved false means on.
function loadHints(storage) {
  try { return JSON.parse(storage.getItem(HINTS_KEY)) !== false; } catch { return true; }
}

// The "Timed" switch as saved. Anything but a saved true means off.
function loadTimed(storage) {
  try { return JSON.parse(storage.getItem(TIMED_KEY)) === true; } catch { return false; }
}

export function createPracticeCore({ storage, clock, random }) {
  const songs = loadSongs(storage);
  const pieces = () => [...ALL_EXERCISES, ...songs];
  const findPiece = (id) => pieces().find((p) => p.id === id);
  // The piece to practise for a listed one: a made-up tune is made up now, anything else is as is.
  const practise = (piece) => piece?.row
    ? { ...piece, ...parseSongText(`title: ${piece.title}\nmelody: ${makeUpTune(piece.row, random).join(" ")}`) }
    : piece;
  // Each piece's tempo, for Timed runs and Listen: the saved one, or the default if none was saved
  // (or it's corrupt). A made-up tune's is kept under its exercise.
  const tempos = loadObject(storage, TEMPOS_KEY);
  const saveTempos = () => storage.setItem(TEMPOS_KEY, JSON.stringify(tempos));
  const inRange = (bpm) => Number.isFinite(bpm) && bpm >= TEMPOS.min && bpm <= TEMPOS.max;
  const tempoOf = (piece) => (inRange(tempos[piece.id]?.bpm) ? tempos[piece.id].bpm : DEFAULT_TEMPO);
  const lockedOf = (piece) => tempos[piece.id]?.locked === true;
  function setTempo(piece, bpm, locked) {
    tempos[piece.id] = { bpm, locked };
    saveTempos();
  }
  // On Auto, a Timed run with enough notes on time takes the tempo up a step for the next run.
  // Returns the finish line's tempo part, or null if the tempo stayed.
  function riseTempo(hits, notes) {
    const { piece } = state;
    const from = tempoOf(piece);
    const to = Math.min(TEMPOS.max, from + TEMPOS.step);
    if (lockedOf(piece) || hits < RISE_AT * notes || to === from) return null;
    setTempo(piece, to, false);
    return `Tempo ${from} → ${to} next time`;
  }
  const fade = loadObject(storage, FADE_KEY); // no saved counts means no tongue has faded yet
  let hintsOn = loadHints(storage);
  let timedOn = loadTimed(storage); // Start begins a Timed run rather than Step mode
  const targets = () => steps()[state.position]; // the current step's tongues
  // The current step's tongues not heard yet: all of them, or the other half of a chord.
  const missing = () => targets().filter((t) => t !== state.partial);

  // The part each piece is in: the saved one, or its first part if none was saved or the saved one
  // no longer fits the piece (say, after an edit).
  const parts = loadObject(storage, PARTS_KEY);
  const partOf = (piece) => (partsOf(piece).includes(parts[piece.id]) ? parts[piece.id] : partsOf(piece)[0]);
  const saveParts = () => storage.setItem(PARTS_KEY, JSON.stringify(parts));
  function setPart(piece, part) {
    parts[piece.id] = part;
    saveParts();
  }

  // Cold runs: the first finished run of a piece in one part on a day is scored and saved. Later
  // runs that day are only shown. Made-up tunes have their own rule (`scoreTune`). Returns the
  // finished run's result line.
  const scores = loadObject(storage, SCORES_KEY);
  const saveScores = () => storage.setItem(SCORES_KEY, JSON.stringify(scores));
  function scoreRun(at) {
    const run = [state.firstStrikeHits, steps().length];
    if (state.piece.row) return scoreTune(run);
    const days = ((scores[state.piece.id] ??= {})[state.part ?? "melody"] ??= {});
    const today = dayOf(at);
    if (today in days) return `again: ${run.join("/")}`;
    const before = Object.keys(days).sort().at(-1);
    days[today] = run;
    saveScores();
    return `First run today: ${run.join("/")}` + (before ? ` · last time ${days[before].join("/")}` : "");
  }

  // Every made-up tune is a cold run: each finished one is saved under its exercise, and its line
  // adds the average of that exercise's latest runs (this one included) once there's more than one.
  const tunes = loadObject(storage, TUNES_KEY);
  const recentTunes = (id) => (Array.isArray(tunes[id]) ? tunes[id] : []);
  // The average of some tune runs as "7.8/8", to one decimal place.
  function averageOf(runs) {
    const mean = (i) => Math.round((runs.reduce((sum, r) => sum + r[i], 0) / runs.length) * 10) / 10;
    return `${mean(0)}/${mean(1)}`;
  }
  function scoreTune(run) {
    const recent = tunes[state.piece.id] = [...recentTunes(state.piece.id), run].slice(-RECENT_TUNES);
    storage.setItem(TUNES_KEY, JSON.stringify(tunes));
    if (recent.length === 1) return run.join("/");
    return `${run.join("/")} · your recent average ${averageOf(recent)}`;
  }

  const saveSongs = () => storage.setItem(SONGS_KEY, JSON.stringify(songs.map((s) => ({ id: s.id, text: s.text }))));
  // The one place a deleted piece's stored data goes: its song text, its being the piece last
  // picked, its part, its tempo and its scores. Anything else stored per piece must be removed here too.
  function forgetPiece(id) {
    if (id in tempos) {
      delete tempos[id];
      saveTempos();
    }
    songs.splice(songs.findIndex((s) => s.id === id), 1);
    saveSongs();
    if (storage.getItem(PIECE_KEY) === id) storage.removeItem(PIECE_KEY);
    if (id in parts) {
      delete parts[id];
      saveParts();
    }
    if (id in scores) {
      delete scores[id];
      saveScores();
    }
  }
  // Only My songs can be edited or deleted; asking for anything else is a programming error.
  function findSong(id) {
    const song = songs.find((s) => s.id === id);
    if (!song) throw new Error(`Not one of My songs: ${id}`);
    return song;
  }

  const state = {
    // The piece last picked, or the first exercise if none was (or it's gone).
    piece: practise(findPiece(storage.getItem(PIECE_KEY))) ?? EXERCISE_PIECES[0],
    part: null, // the part being played; it changes only when a run starts
    playing: false,
    position: 0,
    heard: false, // the current step's tongue(s) were hit; strikes are ignored until the flash ends
    partial: null, // the one tongue of a chord heard so far; both must be struck together again
    firstStrikeHits: 0, // steps of this run hit on their first strike, with no hint shown
    lastHit: null, // { tongues, at }: the step just played, which may still be ringing
    feedback: null,
    result: null, // { score, missed, tempo }: the finished run's line, until the next run's first strike
    missSeq: 0,
    misses: 0, // misses on the current step, half a chord included
    hint: false, // the Location hint is showing for the current step
    done: false, // the piece was finished; strikes are ignored until the next one starts
    doneSeq: 0,
    timer: null, // { at, run }: the one pending change, run once clock() reaches `at`
    overlay: null, // null | "pieces" | "gear" | "editor"
    editor: null, // { pieceId, text, errors } while the paste box is open; pieceId null = a new song
    // Listen, while it plays: { speed, from, at, next, key, held }. Beat `from` of the part sounds
    // at clock time `at`; the part's notes from index `next` on are the ones still to be scheduled;
    // `held` is the run's pending timer, set aside until Listen stops.
    listen: null,
    soundKey: 0, // goes up whenever the scheduled sound changes
    listenedUntil: -Infinity, // when Listen last stopped; the mic was ignored until then
    timed: null, // the Timed run under way (see startTimed), or null in Step mode
    beatSeq: 0, // goes up on every beat of a Timed run, so the pulse restarts
  };
  state.part = partOf(state.piece);
  const steps = () => stepsOf(state.piece, state.part);

  // A piece's progress mark: its latest cold run in its current part, with a trend against the
  // cold run before ("14/18 ↑"). No cold run, no mark. Made-up tunes show theirs at the list top.
  function markOf(piece) {
    if (piece.row) return null;
    const days = scores[piece.id]?.[partOf(piece) ?? "melody"];
    if (!days || typeof days !== "object") return null;
    const [last, before] = Object.keys(days).sort().reverse().map((d) => days[d]).filter(Array.isArray);
    if (!last) return null;
    const ratio = ([hits, steps]) => hits / steps;
    const trend = !before ? "" : ratio(last) > ratio(before) ? " ↑" : ratio(last) < ratio(before) ? " ↓" : " →";
    return last.join("/") + trend;
  }

  // The piece list: Exercises, then My songs.
  function piecesOverlay() {
    const entry = (p) => ({
      id: p.id, title: p.title, current: p.id === state.piece.id, editable: p.group === "my-song", mark: markOf(p),
      // Only a locked tempo is listed: you set it, so you can see it's kept.
      tempo: lockedOf(p) ? `♩ ${tempoOf(p)} 🔒` : null,
    });
    return {
      kind: "pieces",
      // A tongue is found without help once its Location hint has faded.
      found: `${DRUM_NOTES.filter((n) => faded(n.id)).length} of ${DRUM_NOTES.length} tongues found without help`,
      averages: MADE_UP_TUNES.map(({ id, title }) => {
        const recent = recentTunes(id);
        return `${title} · ${recent.length ? `recent average ${averageOf(recent)}` : "no tunes yet"}`;
      }),
      groups: [
        { title: "Exercises", pieces: ALL_EXERCISES.map(entry) },
        { title: "My songs", pieces: songs.map(entry) },
      ],
    };
  }

  // The Location hint: the target's half of the drum map with the target lit. On a chord step only
  // the tongues still missing are lit, and the whole drum shows if they sit on different halves.
  // A missed tongue that isn't drawn is still named by "That was X".
  function hintView() {
    const lit = missing();
    const halves = new Set(lit.map(halfOf));
    const half = halves.size === 1 ? [...halves][0] : "whole";
    const wrong = state.feedback?.thatWas;
    return { half, lit, wrong: wrong && (half === "whole" || halfOf(wrong) === half) ? wrong : null };
  }

  // A tongue's hint retires after enough unaided hits in a row; a miss on it brings it back.
  const faded = (tongue) => (fade[tongue] ?? 0) >= FADE_HITS;

  function countForFade(tongue, unaided) {
    fade[tongue] = unaided ? (fade[tongue] ?? 0) + 1 : 0;
    storage.setItem(FADE_KEY, JSON.stringify(fade));
  }

  // In Step mode every step before the current one was heard. In a Timed run each note is heard,
  // red or still to come, whatever the position.
  const heardStep = (i, id) => (state.timed ? state.timed.marks[i] === "heard"
    : i < state.position || (i === state.position && (state.heard || state.partial === id)));

  function view() {
    const { piece } = state;
    // While Listen plays, the lit number is the one sounding, nothing is green, and the run's
    // "That was" and hint wait until it's back.
    const listening = Boolean(state.listen);
    return {
      piece: { id: piece.id, title: piece.title, group: piece.group, part: state.part },
      playing: state.playing,
      steps: steps().map((tongues, i) => ({
        tongues: tongues.map((id) => ({ id, heard: !listening && heardStep(i, id) })),
        missed: state.timed?.marks[i] === "red",
      })),
      position: listening ? listenPosition(clock()) : state.position,
      feedback: listening ? null : state.feedback,
      hint: state.hint && !listening ? hintView() : null,
      done: state.done ? { title: piece.title, seq: state.doneSeq } : null,
      result: state.result,
      listen: { playing: Boolean(state.listen), speed: state.listen?.speed ?? listenTempo() },
      timed: { on: timedOn, countIn: state.timed?.countIn ?? null, beatSeq: state.beatSeq },
      sound: state.listen ? listenSound() : state.timed?.sound ?? null,
      overlay: state.overlay === "pieces" ? piecesOverlay()
        : state.overlay === "gear" ? { kind: "gear", hints: hintsOn, tempo: { bpm: tempoOf(piece), locked: lockedOf(piece) } }
        : state.overlay === "editor" ? { kind: "editor", ...state.editor, conversionPrompt: conversionPrompt() }
        : null,
    };
  }

  // Listen starts at the piece's tempo.
  const listenTempo = () => tempoOf(state.piece);
  const msPerBeat = (speed) => 60000 / speed;

  // Where Listen is in the part: beats ↔ clock time, at its current speed.
  const listenTime = (beat) => state.listen.at + (beat - state.listen.from) * msPerBeat(state.listen.speed);
  const listenBeat = (now) => state.listen.from + (now - state.listen.at) / msPerBeat(state.listen.speed);
  // Listen ends once the part's last note has had its length.
  const listenEnd = () => listenTime(Math.max(...notesOf(state.piece, state.part).map((n) => n.start + n.length)));

  // The step sounding now: the last one started.
  function listenPosition(now) {
    const beat = listenBeat(now);
    return Math.max(0, stepStarts(state.piece, state.part).findLastIndex((start) => start <= beat));
  }

  // The part's notes still to come in this playback, on the clock, for the screen to sound, in
  // whole ms.
  function listenSound() {
    const { speed, next, key } = state.listen;
    const events = notesOf(state.piece, state.part).slice(next).map((n) => ({
      at: Math.round(listenTime(n.start)), kind: "note", tongue: n.tongue, ms: Math.round(n.length * msPerBeat(speed)),
    }));
    return { key, events };
  }

  // Listen plays the part from the top. The run's pending timer (hint wait, hit flash, done) is
  // held while it plays, so the run is just as it was when Listen stops.
  function startListen(now) {
    const held = state.timer && { left: state.timer.at - now, run: state.timer.run };
    state.timer = null;
    state.listen = { speed: listenTempo(), from: 0, at: now, next: 0, key: ++state.soundKey, held };
  }

  function stopListen(at = clock()) {
    if (!state.listen) return;
    const { held } = state.listen;
    state.listen = null;
    state.listenedUntil = at;
    if (held) schedule(held.left, at, held.run);
  }

  // Sets the one pending timer, replacing any other.
  function schedule(ms, from, run) {
    state.timer = { at: from + ms, run };
  }

  // Runs every timer that's due by `now`, in order; a timer may start the next one.
  function catchUp(now) {
    if (state.listen && listenEnd() <= now) stopListen(listenEnd());
    while (state.timer && state.timer.at <= now) {
      const { at, run } = state.timer;
      state.timer = null;
      run(at);
    }
  }

  function newStep(at) {
    state.heard = false;
    state.partial = null;
    state.misses = 0;
    state.hint = false;
    waitForHint(at);
  }

  // Shows the hint if nothing is struck for a while. Any strike replaces this timer.
  function waitForHint(from) {
    if (state.playing && !state.hint) schedule(HINT_IDLE_MS, from, showHint);
    else state.timer = null;
  }

  // A faded tongue gets no hint until a miss on it brings the hint back. With hints switched off
  // none ever shows, so every hit counts as unaided and the fade stays accurate.
  function showHint() {
    if (hintsOn && missing().some((t) => !faded(t))) state.hint = true;
  }

  function moveOn(at) {
    if (state.position + 1 < steps().length) {
      state.position++;
      newStep(at);
      return;
    }
    state.done = true;
    state.doneSeq++;
    state.result = { score: scoreRun(at), missed: [], tempo: null };
    // A run of first-strike hits moves a two-line piece on to its next part, from the next run on.
    // "Both lines" is the last part and stays put. Nothing is asked.
    const order = partsOf(state.piece);
    const next = order[order.indexOf(state.part) + 1];
    if (next && state.firstStrikeHits === steps().length) setPart(state.piece, next);
    // A finished piece starts again; the app never moves on to another piece by itself. A finished
    // made-up tune makes way for a new one.
    schedule(DONE_MS, at, (from) => {
      state.piece = practise(findPiece(state.piece.id));
      toFirstStep(from);
    });
  }

  // Every run starts here, in the piece's current part.
  function toFirstStep(at = clock()) {
    state.part = partOf(state.piece);
    state.position = 0;
    state.firstStrikeHits = 0;
    newStep(at);
    state.feedback = null;
    state.done = false;
    state.timed = null;
  }

  // A Timed run: the melody line against a beat that doesn't wait. It counts in with clicks, then
  // only the pulse keeps time, so the mic never hears a click while you play. Each note is due at
  // its song-text start, after the count-in.
  function startTimed(at) {
    state.part = partsOf(state.piece)[0]; // the melody line only; the piece's own part is untouched
    const { melody } = state.piece.lines;
    const beat = 60000 / tempoOf(state.piece);
    const due = melody.map((n) => at + (COUNT_IN + n.start) * beat);
    const window = beat / 2; // a note counts if hit this close to when it's due, either side
    // A note not hit by the end of its window turns red once a strike can no longer be on its way.
    const verdict = (i) => due[i] + window + LATE_MS;
    const end = verdict(due.length - 1); // the run ends with the last note's verdict, the pulse too
    // Everything the run does by the clock, in order, run off the one pending timer.
    const events = [];
    const clicks = [];
    for (let b = 0; at + b * beat < end; b++) {
      if (b < COUNT_IN) clicks.push({ at: at + b * beat, kind: "click" });
      events.push({ at: at + b * beat, run: () => {
        state.beatSeq++;
        state.timed.countIn = b < COUNT_IN ? b + 1 : null;
      } });
    }
    due.forEach((d, i) => {
      // The sheet moves on halfway to the next note, whether this one was hit or not.
      if (i + 1 < due.length) events.push({ at: (d + due[i + 1]) / 2, run: () => { state.position = i + 1; } });
      events.push({ at: verdict(i), run: () => { state.timed.marks[i] ??= "red"; } });
    });
    events.push({ at: end, run: finishTimed }); // sorts after the last verdict, at the same time
    events.sort((a, b) => a.at - b.at);
    state.timed = {
      countIn: null, events, due, window, marks: due.map(() => null),
      sound: { key: ++state.soundKey, events: clicks }, // the screen sounds the count-in
    };
    nextTimedEvent(0);
    catchUp(at); // the first click is now
  }

  // A strike in a Timed run goes to the note still to come whose window it falls in (the nearest,
  // where windows overlap). The right tongue is heard; anything else turns the note red.
  function timedStrike({ tongue, at }) {
    const { due, window, marks } = state.timed;
    const open = due.map((d, i) => i).filter((i) => !marks[i] && Math.abs(at - due[i]) <= window);
    if (!open.length) return;
    const nearest = (list) => list.reduce((a, b) => (Math.abs(at - due[b]) < Math.abs(at - due[a]) ? b : a));
    const right = open.filter((i) => steps()[i][0] === tongue);
    if (right.length) {
      marks[nearest(right)] = "heard";
      state.firstStrikeHits++;
      return;
    }
    const i = nearest(open);
    // The note before, struck late or still ringing, isn't a wrong strike on this one.
    if (steps()[i - 1]?.[0] === tongue) return;
    marks[i] = "red";
  }

  // A Timed run is one pass. Its first-strike hits are scored like any run's (melody line), and its
  // line says how many notes were on time and which tongues were missed. Then it waits for Start.
  function finishTimed(at) {
    const notes = steps();
    const red = state.timed.marks.flatMap((m, i) => (m === "red" ? notes[i] : []));
    state.done = true;
    state.doneSeq++;
    scoreRun(at);
    const hits = state.firstStrikeHits;
    state.result = { score: `${hits}/${notes.length} on time`, missed: [...new Set(red)], tempo: riseTempo(hits, notes.length) };
    // A finished made-up tune makes way for a new one, as in Step mode.
    schedule(DONE_MS, at, (from) => {
      state.piece = practise(findPiece(state.piece.id));
      stopTimed(from);
    });
  }

  // Ends a Timed run, finished or not: back to the first note, waiting for Start.
  function stopTimed(at = clock()) {
    state.playing = false;
    toFirstStep(at);
  }

  // Sets the timer for the run's k-th event, which then sets the one after it.
  function nextTimedEvent(k) {
    const e = state.timed.events[k];
    if (!e) return;
    schedule(0, e.at, (from) => {
      e.run(from);
      if (state.timed) nextTimedEvent(k + 1);
    });
  }

  // What a strike does to the current step: "hit", "partial" (one tongue of a chord), "miss" or
  // "ignore". Single-note steps go by the detector's verdict (`tongue`); chord steps go by `ranked`.
  function judge(targets, { tongue, at, ranked }) {
    if (targets.length === 1 && tongue === targets[0]) return "hit";
    if (targets.length > 1) {
      // Struck now, not still ringing from an earlier strike.
      const fresh = (r) => Math.abs(r.at - at) <= CHORD_MS;
      const loudest = ranked.slice(0, targets.length);
      // However close the levels: the chord's tongues are the loudest, all struck together.
      if (loudest.length === targets.length && loudest.every((r) => targets.includes(r.tongue) && fresh(r))) return "hit";
      if (targets.includes(ranked[0].tongue)) return fresh(ranked[0]) ? "partial" : "ignore";
    }
    // Ring-on: the step just played can still sound for a while, and that's never a miss.
    const { lastHit } = state;
    if (lastHit && lastHit.tongues.includes(tongue) && at - lastHit.at <= RING_ON_MS) return "ignore";
    return "miss";
  }

  const commands = {
    tick() {},
    listen() {
      if (state.listen) {
        stopListen();
        return;
      }
      // Listen pauses a Step run, but the beat wouldn't wait: a Timed run stops, waiting for Start.
      if (state.timed) stopTimed();
      startListen(clock());
    },
    nudgeListenSpeed({ by }) {
      if (!state.listen) return;
      // The rest of the part is rescheduled from where Listen is now; the notes already due
      // have sounded.
      const now = clock();
      const beat = listenBeat(now);
      const speed = Math.min(LISTEN_SPEEDS.max, Math.max(LISTEN_SPEEDS.min, state.listen.speed + Math.sign(by) * LISTEN_SPEEDS.step));
      if (speed === state.listen.speed) return;
      const next = notesOf(state.piece, state.part).filter((n) => n.start <= beat).length;
      Object.assign(state.listen, { speed, from: beat, at: now, next, key: ++state.soundKey });
    },
    start() {
      stopListen();
      state.playing = true;
      const at = clock();
      toFirstStep(at);
      if (timedOn) startTimed(at);
    },
    open({ what, pieceId }) {
      if (what !== "pieces" && what !== "gear" && what !== "editor") throw new Error(`Unknown overlay: ${what}`);
      // Editing a song reopens its saved text; without a pieceId the paste box is for a new song.
      const song = what === "editor" && pieceId != null ? findSong(pieceId) : null;
      stopListen(); // an overlay covers the numbers Listen lights
      state.overlay = what;
      // The beat wouldn't wait while the overlay is open, so a Timed run stops, waiting for Start.
      if (state.timed) stopTimed();
      if (what === "editor") state.editor = { pieceId: song?.id ?? null, text: song?.text ?? "", errors: [] };
    },
    saveSong({ text }) {
      // Saves to the song the paste box was opened for, or adds a new one.
      const pieceId = state.editor?.pieceId ?? null;
      // A bad paste isn't an error: the paste box shows what's wrong, and nothing is saved.
      const errors = checkSongText(text);
      if (errors.length) {
        state.overlay = "editor";
        state.editor = { pieceId, text, errors };
        return;
      }
      if (pieceId != null) {
        const i = songs.indexOf(findSong(pieceId));
        songs[i] = mySong({ id: pieceId, text });
        // The current song's notes may have changed, so its run starts over, waiting for Start.
        if (state.piece.id === pieceId) {
          state.piece = songs[i];
          state.playing = false;
          state.result = null;
          toFirstStep();
        }
      } else {
        const n = Math.max(0, ...songs.map((s) => Number(s.id.slice("song-".length)) || 0)) + 1;
        songs.push(mySong({ id: `song-${n}`, text }));
      }
      saveSongs();
      state.overlay = "pieces";
      state.editor = null;
    },
    deleteSong({ pieceId }) {
      // The screen asks the learner to confirm first; by now it's decided.
      forgetPiece(findSong(pieceId).id);
      // Deleting the current song quietly switches to the first exercise.
      if (state.piece.id === pieceId) {
        state.piece = EXERCISE_PIECES[0];
        state.playing = false;
        state.result = null;
        toFirstStep();
      }
      if (state.editor?.pieceId === pieceId) {
        state.overlay = "pieces";
        state.editor = null;
      }
    },
    close() {
      // The paste box was opened from the piece list, so closing it goes back there.
      state.overlay = state.overlay === "editor" ? "pieces" : null;
      state.editor = null;
    },
    setHints({ on }) {
      hintsOn = Boolean(on);
      storage.setItem(HINTS_KEY, JSON.stringify(hintsOn));
      // Switching on takes effect from the next miss or wait, not on the spot.
      if (!hintsOn) state.hint = false;
    },
    setTimed({ on }) {
      // Takes effect from the next Start; a run under way carries on as it began.
      timedOn = Boolean(on);
      storage.setItem(TIMED_KEY, JSON.stringify(timedOn));
    },
    nudgeTempo({ by }) {
      // The gear's −/+ for the current piece: setting a tempo yourself locks it. It takes effect
      // from the next run.
      const bpm = Math.min(TEMPOS.max, Math.max(TEMPOS.min, tempoOf(state.piece) + Math.sign(by) * TEMPOS.step));
      setTempo(state.piece, bpm, true);
    },
    setTempoAuto() {
      // The app takes the tempo back from where it was set, rather than from the default.
      setTempo(state.piece, tempoOf(state.piece), false);
    },
    pick({ pieceId }) {
      const piece = findPiece(pieceId);
      if (!piece) throw new Error(`Unknown piece: ${pieceId}`);
      stopListen();
      state.piece = practise(piece);
      storage.setItem(PIECE_KEY, piece.id);
      state.overlay = null;
      // Picking abandons any run: the learner is the one who presses Start. The last piece's
      // result line goes with it.
      state.playing = false;
      state.result = null;
      toFirstStep();
    },
    strike({ tongue, at, ranked = [{ tongue, level: 1, at }] }) {
      if (!state.playing || state.heard || state.done || state.overlay) return;
      // The mic is ignored while Listen plays, so the app's own sound is never a strike, even one
      // that arrives a little after Listen stopped.
      if (state.listen || at < state.listenedUntil) return;
      state.result = null; // the last run's line goes once the next one is under way
      // A Timed run never shows a hint and never counts towards the fade.
      if (state.timed) {
        timedStrike({ tongue, at });
        return;
      }
      const verdict = judge(targets(), { tongue, at, ranked });
      if (verdict === "ignore") return;
      if (verdict === "hit") {
        // A hit made after the hint appeared isn't unaided. A chord counts for both its tongues.
        for (const t of targets()) countForFade(t, !state.hint);
        if (!state.misses && !state.hint) state.firstStrikeHits++;
        state.heard = true;
        state.feedback = null;
        state.lastHit = { tongues: targets(), at };
        // The flash is for the eye, so it runs from when the strike arrives, not from its onset
        // (`at`), or a late strike would barely show. Onsets matter once there's a beat (#38).
        schedule(HIT_FLASH_MS, clock(), moveOn);
        return;
      }
      // Half a chord turns that number green, and the step waits for both tongues together.
      if (verdict === "partial") state.partial = ranked[0].tongue;
      else state.feedback = { thatWas: tongue, seq: ++state.missSeq };
      for (const t of missing()) countForFade(t, false);
      if (++state.misses >= HINT_MISSES) showHint();
      waitForHint(clock());
    },
  };

  let last = null, lastJson = "";

  function send(command) {
    const run = commands[command.type];
    if (!run) throw new Error(`Unknown command: ${command.type}`);
    catchUp(clock());
    run(command);
    const next = view();
    const json = JSON.stringify(next);
    if (json !== lastJson) [last, lastJson] = [next, json];
    return last;
  }

  return { send };
}
