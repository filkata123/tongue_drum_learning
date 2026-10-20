// The practice core: every Step mode rule, with no DOM, mic or audio output.
// The screen turns DOM events and detector strikes into commands and renders the view that
// send() returns. See docs/adr/0001-practice-core-single-send-and-view-snapshot.md.
import { EXERCISES, halfOf } from "./notes.js";
import { checkSongText, conversionPrompt, parseSongText } from "./songtext.js";

const HIT_FLASH_MS = 250; // the right tongue shows green this long before moving on
const DONE_MS = 1500;      // "done" shows this long before the piece starts again
const HINT_MISSES = 2;     // the Location hint appears after this many misses on a step…
const HINT_IDLE_MS = 5000; // …or after this long with no strike, whichever comes first
const FADE_HITS = 3;       // after this many unaided hits in a row, a tongue's hint retires

// Every exercise goes through the same parser as a pasted song.
const EXERCISE_PIECES = EXERCISES.map(({ id, text }) => ({ id, group: "exercise", ...parseSongText(text) }));

// Step mode's tongues, one per step. Until two-line Step mode lands, a two-line piece plays its
// melody line.
const stepTongues = (piece) => piece.lines.melody.map((n) => n.tongue);

const PIECE_KEY = "tongue-drum:piece"; // the id of the piece last picked
const SONGS_KEY = "tongue-drum:songs"; // My songs: [{ id, text }], in the order they were added
const FADE_KEY = "tongue-drum:fade";   // unaided hits in a row, per tongue: { [tongue]: count }

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

// The fade counts as saved. Anything corrupt means no tongue has faded yet.
function loadFade(storage) {
  try {
    const saved = JSON.parse(storage.getItem(FADE_KEY));
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

export function createPracticeCore({ storage, clock, random }) {
  const songs = loadSongs(storage);
  const pieces = () => [...EXERCISE_PIECES, ...songs];
  const findPiece = (id) => pieces().find((p) => p.id === id);
  const fade = loadFade(storage);
  const target = () => stepTongues(state.piece)[state.position]; // the current step's tongue
  const saveSongs = () => storage.setItem(SONGS_KEY, JSON.stringify(songs.map((s) => ({ id: s.id, text: s.text }))));
  // The one place a deleted piece's stored data goes: its song text, and its being the piece last
  // picked. Anything stored per piece later (part, scores, tempo) must be removed here too.
  function forgetPiece(id) {
    songs.splice(songs.findIndex((s) => s.id === id), 1);
    saveSongs();
    if (storage.getItem(PIECE_KEY) === id) storage.removeItem(PIECE_KEY);
  }
  // Only My songs can be edited or deleted; asking for anything else is a programming error.
  function findSong(id) {
    const song = songs.find((s) => s.id === id);
    if (!song) throw new Error(`Not one of My songs: ${id}`);
    return song;
  }

  const state = {
    // The piece last picked, or the first exercise if none was (or it's gone).
    piece: findPiece(storage.getItem(PIECE_KEY)) ?? EXERCISE_PIECES[0],
    playing: false,
    position: 0,
    heard: false, // the current step's tongue was hit; strikes are ignored until the flash ends
    feedback: null,
    missSeq: 0,
    misses: 0, // misses on the current step
    hint: false, // the Location hint is showing for the current step
    done: false, // the piece was finished; strikes are ignored until the next one starts
    doneSeq: 0,
    timer: null, // { at, run }: the one pending change, run once clock() reaches `at`
    overlay: null, // null | "pieces" | "editor"
    editor: null, // { pieceId, text, errors } while the paste box is open; pieceId null = a new song
  };

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

  // The Location hint: the target's half of the drum map with the target lit. A missed tongue on
  // the other half isn't drawn; "That was X" names it.
  function hintView() {
    const half = halfOf(target());
    const wrong = state.feedback?.thatWas;
    return { half, lit: [target()], wrong: wrong && halfOf(wrong) === half ? wrong : null };
  }

  // A tongue's hint retires after enough unaided hits in a row; a miss on it brings it back.
  const faded = (tongue) => (fade[tongue] ?? 0) >= FADE_HITS;

  function countForFade(tongue, unaided) {
    fade[tongue] = unaided ? (fade[tongue] ?? 0) + 1 : 0;
    storage.setItem(FADE_KEY, JSON.stringify(fade));
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
      hint: state.hint ? hintView() : null,
      done: state.done ? { title: piece.title, seq: state.doneSeq } : null,
      overlay: state.overlay === "pieces" ? piecesOverlay()
        : state.overlay === "editor" ? { kind: "editor", ...state.editor, conversionPrompt: conversionPrompt() }
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

  function newStep(at) {
    state.heard = false;
    state.misses = 0;
    state.hint = false;
    waitForHint(at);
  }

  // Shows the hint if nothing is struck for a while. Any strike replaces this timer.
  function waitForHint(from) {
    if (state.playing && !state.hint) schedule(HINT_IDLE_MS, from, showHint);
    else state.timer = null;
  }

  // A faded tongue gets no hint until a miss on it brings the hint back.
  function showHint() {
    if (!faded(target())) state.hint = true;
  }

  function moveOn(at) {
    if (state.position + 1 < stepTongues(state.piece).length) {
      state.position++;
      newStep(at);
      return;
    }
    state.done = true;
    state.doneSeq++;
    // A finished piece starts again; the app never moves on to another piece by itself.
    schedule(DONE_MS, at, toFirstStep);
  }

  function toFirstStep(at = clock()) {
    state.position = 0;
    newStep(at);
    state.feedback = null;
    state.done = false;
  }

  const commands = {
    tick() {},
    start() {
      state.playing = true;
      toFirstStep();
    },
    open({ what, pieceId }) {
      if (what !== "pieces" && what !== "editor") throw new Error(`Unknown overlay: ${what}`);
      // Editing a song reopens its saved text; without a pieceId the paste box is for a new song.
      const song = what === "editor" && pieceId != null ? findSong(pieceId) : null;
      state.overlay = what;
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
      if (tongue === target()) {
        // A hit made after the hint appeared isn't unaided.
        countForFade(tongue, !state.hint);
        state.heard = true;
        state.feedback = null;
        // The flash is for the eye, so it runs from when the strike arrives, not from its onset
        // (`at`), or a late strike would barely show. Onsets matter once there's a beat (#38).
        schedule(HIT_FLASH_MS, clock(), moveOn);
      } else {
        state.feedback = { thatWas: tongue, seq: ++state.missSeq };
        countForFade(target(), false);
        if (++state.misses >= HINT_MISSES) showHint();
        waitForHint(clock());
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
