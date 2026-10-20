// The practice core: every Step mode rule, with no DOM, mic or audio output.
// The screen turns DOM events and detector strikes into commands and renders the view that
// send() returns. See docs/adr/0001-practice-core-single-send-and-view-snapshot.md.
import { EXERCISES } from "./notes.js";
import { parseSongText } from "./songtext.js";

const HIT_FLASH_MS = 250; // the right tongue shows green this long before moving on
const DONE_MS = 1500;      // "done" shows this long before the piece starts again

// Every exercise goes through the same parser as a pasted song.
const PIECES = EXERCISES.map(({ id, text }) => ({ id, group: "exercise", ...parseSongText(text) }));

// Step mode's tongues, one per step. Until two-line Step mode lands, a two-line piece plays its
// melody line.
const stepTongues = (piece) => piece.lines.melody.map((n) => n.tongue);

const PIECE_KEY = "tongue-drum:piece"; // the id of the piece last picked

const findPiece = (id) => PIECES.find((p) => p.id === id);

export function createPracticeCore({ storage, clock, random }) {
  const state = {
    // The piece last picked, or the first exercise if none was (or it's gone).
    piece: findPiece(storage.getItem(PIECE_KEY)) ?? PIECES[0],
    playing: false,
    position: 0,
    heard: false, // the current step's tongue was hit; strikes are ignored until the flash ends
    feedback: null,
    missSeq: 0,
    done: false, // the piece was finished; strikes are ignored until the next one starts
    doneSeq: 0,
    timer: null, // { at, run }: the one pending change, run once clock() reaches `at`
    overlay: null, // null | "pieces"
  };

  // The piece list: Exercises, then My songs (empty until songs can be added).
  function piecesOverlay() {
    const entry = (p) => ({ id: p.id, title: p.title, current: p === state.piece, editable: p.group === "my-song", mark: null, tempo: null });
    return {
      kind: "pieces",
      found: "",
      averages: [],
      groups: [
        { title: "Exercises", pieces: PIECES.filter((p) => p.group === "exercise").map(entry) },
        { title: "My songs", pieces: PIECES.filter((p) => p.group === "my-song").map(entry) },
      ],
    };
  }

  function view() {
    const { piece } = state;
    return {
      // Until two-line Step mode lands, a two-line piece is always in its melody part.
      piece: { id: piece.id, title: piece.title, group: piece.group, part: piece.lines.accomp ? "melody" : null },
      playing: state.playing,
      steps: stepTongues(piece).map((id, i) => ({
        tongues: [{ id, heard: i < state.position || (i === state.position && state.heard) }],
        missed: false,
      })),
      position: state.position,
      feedback: state.feedback,
      done: state.done ? { title: piece.title, seq: state.doneSeq } : null,
      overlay: state.overlay === "pieces" ? piecesOverlay() : null,
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

  function moveOn(at) {
    if (state.position + 1 < stepTongues(state.piece).length) {
      state.position++;
      state.heard = false;
      return;
    }
    state.done = true;
    state.doneSeq++;
    // A finished piece starts again; the app never moves on to another piece by itself.
    schedule(DONE_MS, at, toFirstStep);
  }

  function toFirstStep() {
    state.position = 0;
    state.heard = false;
    state.feedback = null;
    state.done = false;
    state.timer = null;
  }

  const commands = {
    tick() {},
    start() {
      state.playing = true;
      toFirstStep();
    },
    open({ what }) {
      if (what !== "pieces") throw new Error(`Unknown overlay: ${what}`);
      state.overlay = what;
    },
    close() {
      state.overlay = null;
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
    strike({ tongue }) {
      if (!state.playing || state.heard || state.done || state.overlay) return;
      const target = stepTongues(state.piece)[state.position];
      if (tongue === target) {
        state.heard = true;
        state.feedback = null;
        // The flash is for the eye, so it runs from when the strike arrives, not from its onset
        // (`at`), or a late strike would barely show. Onsets matter once there's a beat (#38).
        schedule(HIT_FLASH_MS, clock(), moveOn);
      } else {
        state.feedback = { thatWas: tongue, seq: ++state.missSeq };
      }
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
