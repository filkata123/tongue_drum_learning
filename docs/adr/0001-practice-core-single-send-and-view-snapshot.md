# Practice core: one `send(command) → view snapshot`, with time only from the injected clock

All practice rules live in a DOM-free practice core, created with `{ storage, clock, random }` (`localStorage`, `Date.now`, `Math.random` in the app; a `Map` fake, a settable time and a seeded source in tests). Its whole interface is `send(command)`, which returns one plain-JSON view snapshot. The screen only turns DOM events and detector strikes into commands and renders what comes back. The full interface is on #22.

We chose this so that every rule in #21 (hint timing, chords, cold runs, Listen, Timed mode) can be tested by sending commands and checking the snapshot, with no browser UI or mic. A command log can also be replayed to reproduce a session.

## Consequences

- **Time only enters through `clock`.** The core owns no timers. Every command first catches up to `clock()`, and `tick` does nothing else. Times inside commands (`strike.at`) are on the clock's timeline, and the screen converts detector time to it. Strikes arrive up to ~300 ms after their onset, and the core must still count them.
- **One-off outputs are data, not events.** Sounds (Listen notes, count-in clicks) are a declarative schedule `sound: { key, events }`: when `key` changes, the screen cancels what it scheduled and schedules the new events on the `AudioContext`. Animations that must restart (the miss shake, the "done" flash) are counters (`seq`). Rendering the same snapshot twice is always safe.
- **`send` returns the same object when nothing changed**, so a 60 Hz `tick` costs the screen nothing.
- **The song-text parser and the made-up tune generator are internal seams.** Their rules (rhythm, tune shaping) can't be seen through Step mode's view, so the core's own tests call them directly. Callers never import them.

## Considered options

- **A methods object** (`core.strike()`, `core.start()`, …): just as capable, but about 18 entry points and no replayable command log.
- **`send → { view, effects[] }`:** effects need ordering and make rendering non-idempotent. Timing Listen notes from rAF ticks would also be worse than scheduling them ahead.
- **A pure reducer `(state, cmd) → state`:** the state shape becomes the interface, and persistence moves out to every caller.
