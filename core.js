// The practice core: every Step mode rule, with no DOM, mic or audio output.
// The screen turns DOM events and detector strikes into commands and renders the view that
// send() returns. See docs/adr/0001-practice-core-single-send-and-view-snapshot.md.
import { EXERCISES } from "./notes.js";
import { checkSongText, conversionPrompt, parseSongText } from "./songtext.js";

const HIT_FLASH_MS = 250; // the right tongue shows green this long before moving on
const DONE_MS = 1500;      // "done" shows this long before the piece starts again
const CHORD_MS = 100;      // a chord's tongues must each start sounding this close to the strike
const RING_ON_MS = 1500;   // the step just played may still ring this long after it was hit

// Every exercise goes through the same parser as a pasted song.
const EXERCISE_PIECES = EXERCISES.map(({ id, text }) => ({ id, group: "exercise", ...parseSongText(text) }));

// A two-line piece is taught in three parts, in this order. A one-line piece has no part (null).
const partsOf = (piece) => (piece.lines.accomp?.length ? ["melody", "accomp", "both"] : [null]);

// Step mode's steps in a part: each step is the tongues struck together, melody first.
function stepsOf(piece, part) {
  if (part === "both") return piece.both.map((s) => s.tongues);
  return piece.lines[part === "accomp" ? "accomp" : "melody"].map((n) => [n.tongue]);
}

const PIECE_KEY = "tongue-drum:piece"; // the id of the piece last picked
const SONGS_KEY = "tongue-drum:songs"; // My songs: [{ id, text }], in the order they were added
const PARTS_KEY = "tongue-drum:parts"; // { [pieceId]: part }, for two-line pieces past their first part

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

// Each piece's part as saved. Anything corrupt means every piece is in its first part.
function loadParts(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PARTS_KEY));
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

export function createPracticeCore({ storage, clock, random }) {
  const songs = loadSongs(storage);
  const pieces = () => [...EXERCISE_PIECES, ...songs];
  const findPiece = (id) => pieces().find((p) => p.id === id);

  // The part each piece is in: the saved one, or its first part if none was saved or the saved one
  // no longer fits the piece.
  const parts = loadParts(storage);
  const partOf = (piece) => (partsOf(piece).includes(parts[piece.id]) ? parts[piece.id] : partsOf(piece)[0]);
  const saveParts = () => storage.setItem(PARTS_KEY, JSON.stringify(parts));
  function setPart(piece, part) {
    parts[piece.id] = part;
    saveParts();
  }
  // Deleting a song must forget its part, or a later song given the same id would start in it.
  // deleteSong (#26) calls this.
  function forgetPart(pieceId) {
    if (!(pieceId in parts)) return;
    delete parts[pieceId];
    saveParts();
  }

  const state = {
    // The piece last picked, or the first exercise if none was (or it's gone).
    piece: findPiece(storage.getItem(PIECE_KEY)) ?? EXERCISE_PIECES[0],
    part: null, // the part being played; it changes only when a run starts
    playing: false,
    position: 0,
    heard: false, // the current step's tongue(s) were hit; strikes are ignored until the flash ends
    partial: null, // the one tongue of a chord heard so far; both must be struck together again
    firstStrike: true, // nothing but the hit has been struck on the current step yet
    firstStrikeHits: 0, // steps of this run hit on their first strike
    lastHit: null, // { tongues, at }: the step just played, which may still be ringing
    feedback: null,
    missSeq: 0,
    done: false, // the piece was finished; strikes are ignored until the next one starts
    doneSeq: 0,
    timer: null, // { at, run }: the one pending change, run once clock() reaches `at`
    overlay: null, // null | "pieces" | "editor"
    editor: null, // { text, errors } while the paste box is open
  };
  state.part = partOf(state.piece);
  const steps = () => stepsOf(state.piece, state.part);

  // The piece list: Exercises, then My songs.
  function piecesOverlay() {
    const entry = (p) => ({ id: p.id, title: p.title, current: p === state.piece, editable: p.group === "my-song", mark: null, tempo: null });
    return {
      kind: "pieces",
      found: "",
      averages: [],
      groups: [
        { title: "Exercises", pieces: EXERCISE_PIECES.map(entry) },
        { title: "My songs", pieces: songs.map(entry) },
      ],
    };
  }

  function view() {
    const { piece } = state;
    return {
      piece: { id: piece.id, title: piece.title, group: piece.group, part: state.part },
      playing: state.playing,
      steps: steps().map((tongues, i) => ({
        tongues: tongues.map((id) => ({
          id,
          heard: i < state.position || (i === state.position && (state.heard || state.partial === id)),
        })),
        missed: false,
      })),
      position: state.position,
      feedback: state.feedback,
      done: state.done ? { title: piece.title, seq: state.doneSeq } : null,
      overlay: state.overlay === "pieces" ? piecesOverlay()
        : state.overlay === "editor" ? { kind: "editor", pieceId: null, ...state.editor, conversionPrompt: conversionPrompt() }
        : null,
    };
  }

  // Sets the one pending timer, replacing any other.
  function schedule(ms, from, run) {
    state.timer = { at: from + ms, run };
  }

  // Runs every timer that's due by `now`, in order; a timer may start the next one.
  function catchUp(now) {
    while (state.timer && state.timer.at <= now) {
      const { at, run } = state.timer;
      state.timer = null;
      run(at);
    }
  }

  function toStep(position) {
    state.position = position;
    state.heard = false;
    state.partial = null;
    state.firstStrike = true;
  }

  function moveOn(at) {
    if (state.position + 1 < steps().length) {
      toStep(state.position + 1);
      return;
    }
    state.done = true;
    state.doneSeq++;
    // A run of first-strike hits moves a two-line piece on to its next part, from the next run on.
    // "Both lines" is the last part and stays put. Nothing is asked.
    const order = partsOf(state.piece);
    const next = order[order.indexOf(state.part) + 1];
    if (next && state.firstStrikeHits === steps().length) setPart(state.piece, next);
    // A finished piece starts again; the app never moves on to another piece by itself.
    schedule(DONE_MS, at, toFirstStep);
  }

  // Every run starts here, in the piece's current part.
  function toFirstStep() {
    state.part = partOf(state.piece);
    toStep(0);
    state.firstStrikeHits = 0;
    state.feedback = null;
    state.done = false;
    state.timer = null;
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
    start() {
      state.playing = true;
      toFirstStep();
    },
    open({ what }) {
      if (what !== "pieces" && what !== "editor") throw new Error(`Unknown overlay: ${what}`);
      state.overlay = what;
      if (what === "editor") state.editor = { text: "", errors: [] };
    },
    saveSong({ text }) {
      // A bad paste isn't an error: the paste box shows what's wrong, and nothing is saved.
      const errors = checkSongText(text);
      if (errors.length) {
        state.overlay = "editor";
        state.editor = { text, errors };
        return;
      }
      const n = Math.max(0, ...songs.map((s) => Number(s.id.slice("song-".length)) || 0)) + 1;
      songs.push(mySong({ id: `song-${n}`, text }));
      storage.setItem(SONGS_KEY, JSON.stringify(songs.map((s) => ({ id: s.id, text: s.text }))));
      state.overlay = "pieces";
      state.editor = null;
    },
    close() {
      // The paste box was opened from the piece list, so closing it goes back there.
      state.overlay = state.overlay === "editor" ? "pieces" : null;
      state.editor = null;
    },
    pick({ pieceId }) {
      const piece = findPiece(pieceId);
      if (!piece) throw new Error(`Unknown piece: ${pieceId}`);
      state.piece = piece;
      storage.setItem(PIECE_KEY, piece.id);
      state.overlay = null;
      // Picking abandons any run: the learner is the one who presses Start.
      state.playing = false;
      toFirstStep();
    },
    strike({ tongue, at, ranked = [{ tongue, level: 1, at }] }) {
      if (!state.playing || state.heard || state.done || state.overlay) return;
      const targets = steps()[state.position];
      const verdict = judge(targets, { tongue, at, ranked });
      if (verdict === "ignore") return;
      if (verdict === "hit") {
        state.heard = true;
        state.feedback = null;
        if (state.firstStrike) state.firstStrikeHits++;
        state.lastHit = { tongues: targets, at };
        // The flash is for the eye, so it runs from when the strike arrives, not from its onset
        // (`at`), or a late strike would barely show. Onsets matter once there's a beat (#38).
        schedule(HIT_FLASH_MS, clock(), moveOn);
        return;
      }
      state.firstStrike = false;
      // Half a chord turns that number green, and the step waits for both tongues together.
      if (verdict === "partial") state.partial = ranked[0].tongue;
      else state.feedback = { thatWas: tongue, seq: ++state.missSeq };
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
