# Tongue Drum Practice

A practice app for learning the tongue drum without needing music theory. It shows one big number
(the tongue to hit), listens through the microphone, and moves on when you play the right note.
The goal is to make it as easy as possible to get the drum out and just play.

Made for a 13" 15-note D major tongue drum (low F# to high F#), using the number notation printed
on most tongue drums: `1`–`7` for the middle row, a dot below for the lower notes and a dot above
for the upper notes.

## Web version (main)

The app lives in `web/` and runs in the browser on a laptop, phone or tablet.

- Press **Start** and play the big number. It turns green and moves on when you hit the right note.
- If you hit a different note, it shows what you played.
- The next note is shown in the corner, and dots at the top show progress through the melody.
- When a melody is finished it moves on to the next one, and remembers where you left off.
- On phones it keeps the screen awake while you practise.

### Running it

```bash
cd web
python -m http.server 8000
```

Then open http://localhost:8000 and allow the microphone. Phones only allow the microphone over
`https://`, so to use it on a phone it needs to be hosted (e.g. GitHub Pages).

If you change the code, reload with **Ctrl+Shift+R** so the browser doesn't keep the old version.

### Extras

- `?sim`: no microphone; play a fake drum with the keyboard (1–7 middle row, Z X C V B lower,
  8 9 0 upper).
- `?debug`: shows a bar per tongue with how loudly the mic hears it; a note only counts once its
  bar passes the orange line (the bar turns green). Useful for checking what a microphone can hear.
- `test.html`: runs the note detector against synthetic drum strikes, including real-drum quirks
  like neighbouring tongues ringing along.

### How note detection works

`web/pitch.js` measures how loud each of the drum's 15 notes is, about 60 times a second. A strike
is a sudden jump in volume (or one note suddenly getting louder), and the note whose level rose the
most is the one that was hit, so notes that are still ringing don't get in the way. Thresholds
adapt to the room and microphone, so quiet headset mics work too. Settings are in `CONFIG` at the
top of the file.

Known limitation: hitting the same note again very quickly (under about half a second) while it
still rings loudly can occasionally be missed; just hit it again.

## Desktop version (original)

`tongue_drum_practice.py` is the first version: a tkinter app that shows the previous, current and
next note in time with a metronome, with a melody picker and tempo control (40–220 BPM). It doesn't
listen to you play.

```bash
pip install playsound
python tongue_drum_practice.py
```

## Attributions
- **Claude Haiku 4.5**: Used for implementing the desktop version.
- **Claude Opus 5.5**: Used for implementing the web version.

- **Metronome Sound**: Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=85688">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=85688">Pixabay</a>
- **Audio Trimming**: Audio trimmed using [AudioTrimmer.com](https://audiotrimmer.com) for free

---

Enjoy practicing your tongue drum!
