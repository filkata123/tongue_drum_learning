# Tongue Drum Practice

A practice app for learning the tongue drum without needing music theory. It shows one big number
(the tongue to hit), listens through the microphone, and moves on when you play the right note.
The goal is to make it as easy as possible to get the drum out and just play.

Made for a 13" 15-note D major tongue drum (low F# to high F#), using the number notation printed
on most tongue drums: `1`–`7` for the middle row, a dot below for the lower notes and a dot above
for the upper notes.

It runs in the browser on a laptop, phone or tablet.

- Press **Start** and play the big number. It turns green and moves on when you hit the right note.
- If you hit a different note, it shows what you played.
- The next note is shown in the corner, and dots at the top show progress through the melody.
- When a melody is finished it moves on to the next one, and remembers where you left off.
- On phones it keeps the screen awake while you practise.

## Running it

```bash
python -m http.server 8000
```

Then open http://localhost:8000 and allow the microphone. Phones only allow the microphone over
`https://`, so to use it on a phone it needs to be hosted (e.g. GitHub Pages).

If you change the code, reload with **Ctrl+Shift+R** so the browser doesn't keep the old version.

## Extras

- `?sim`: no microphone; play a fake drum with the keyboard (1–7 middle row, Z X C V B lower,
  8 9 0 upper).
- `?debug`: shows a bar per tongue with how loudly the mic hears it; a note only counts once its
  bar passes the orange line (the bar turns green). Useful for checking what a microphone can hear.
- `test.html`: runs the note detector against synthetic drum strikes, including real-drum quirks
  like neighbouring tongues ringing along.

## How note detection works

`pitch.js` measures how loud each of the drum's 15 notes is, about 60 times a second. A strike
is a sudden jump in volume (or one note suddenly getting louder), and the note whose level rose the
most is the one that was hit, so notes that are still ringing don't get in the way. Thresholds
adapt to the room and microphone, so quiet headset mics work too. Settings are in `CONFIG` at the
top of the file.

Known limitation: hitting the same note again very quickly (under about half a second) while it
still rings loudly can occasionally be missed; just hit it again.

## Attributions
- **Claude Opus 5.5**: Used for implementing the app.

---

Enjoy practicing your tongue drum!
