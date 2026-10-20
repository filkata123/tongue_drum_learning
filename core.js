// The practice core: every Step mode rule, with no DOM, mic or audio output.
// The screen turns DOM events and detector strikes into commands and renders the view that
// send() returns. See docs/adr/0001-practice-core-single-send-and-view-snapshot.md.
import { MELODIES } from "./notes.js";

const HIT_FLASH_MS = 250; // the right tongue shows green this long before moving on
const DONE_MS = 1500;      // "done" shows this long before the next exercise starts
const PIECE_KEY = "tongue-drum:melody";

// The exercise to pick up at; anything but a whole number in range means the first one.
function storedPieceIdx(storage) {
  const idx = Number(storage.getItem(PIECE_KEY));
  return Number.isInteger(idx) && idx >= 0 && idx < MELODIES.length ? idx : 0;
}

export function createPracticeCore({ storage, clock, random }) {
  const state = {
    pieceIdx: storedPieceIdx(storage),
    playing: false,
    position: 0,
    heard: false, // the current step's tongue was hit; strikes are ignored until the flash ends
    feedback: null,
    missSeq: 0,
    done: false, // the piece was finished; strikes are ignored until the next one starts
    doneSeq: 0,
    timer: null, // { at, run }: the one pending change, run once clock() reaches `at`
  };

  const currentPiece = () => MELODIES[state.pieceIdx];

  function view() {
    const piece = currentPiece();
    return {
      piece: { id: piece.id, title: piece.name, group: "exercise", part: null },
      playing: state.playing,
      steps: piece.notes.map((id, i) => ({
        tongues: [{ id, heard: i < state.position || (i === state.position && state.heard) }],
        missed: false,
      })),
      position: state.position,
      feedback: state.feedback,
      done: state.done ? { title: piece.name, seq: state.doneSeq } : null,
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
    if (state.position + 1 < currentPiece().notes.length) {
      state.position++;
      state.heard = false;
      return;
    }
    state.done = true;
    state.doneSeq++;
    schedule(DONE_MS, at, nextPiece);
  }

  // Today's Step mode moves straight on to the next exercise (#24 replaces this with a picker).
  function nextPiece() {
    state.pieceIdx = (state.pieceIdx + 1) % MELODIES.length;
    storage.setItem(PIECE_KEY, String(state.pieceIdx));
    toFirstStep();
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
    strike({ tongue }) {
      if (!state.playing || state.heard || state.done) return;
      const target = currentPiece().notes[state.position];
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
