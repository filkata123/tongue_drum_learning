# How tongue drum song sheets show hands, chords and rhythm

Research for issue #2 (child of map #1). Question: what do real tongue drum song sheets look
like, specifically hand/mallet markings, two-notes-at-once, rhythm, and a plain-text form?

Sources are drum makers' and sellers' own reading guides, published beginner songbooks (their
listing/preview text), and publisher arrangement pages. "How common" is judged from how many of
these independent sources use a convention. It is not a formal survey.

## TL;DR

| Convention | What it looks like | How common (in beginner material) |
|---|---|---|
| Numbers 1-7 = scale degrees, matching the stickers on the drum | `3 3 4 5` | Close to all sources |
| Octave = dot above (high) / below (low) | `1̇`, `1̣`; text stand-ins `1°`, `1*` | Close to all sources; plain-text forms vary |
| **Hand / mallet (L/R)** | — | **Nearly absent.** No tongue drum source found prints L/R. Hand use is given as prose advice, if at all |
| **Two notes at once** | `(16)` or `1-6`; or a separate harmony line | **Uncommon in beginner sheets.** Shows up in "advanced" scores and in arrangements with a chord line |
| Rhythm: none, or spacing only | `1 1 5 5 6 6 5` | Very common in the simplest beginner books |
| Rhythm: bar lines `\|`, dash `-` = hold, `0` = rest | `1 1 5 5 \| 6 6 5 -` | Common in web tabs and "advanced" scores |
| Rhythm: underline = shorter (jianpu) | <u>1 2</u> | Explained in guides, but lost in plain text |
| Rhythm: staff notation above the numbers | standard staff + numbers | Publisher arrangements (Hal Leonard-style, Riffspot) |

## 1. Hands / mallets

- **No tongue drum source I found marks L/R on the notes.** The Instruments du Monde reading
  guide covers pitch, rhythm, ties and dots, and only says mallets suit beginners and fingers allow
  more speed. It has no hand markings.
  ([Instruments du Monde, How to read tongue drum sheet music](https://instruments-du-monde.com/en/blogs/tongue-drum/how-to-read-tongue-drum-sheet-music))
- The Riffspot 15-note guide (tablature plus staff) has no hand markings.
  ([Riffspot, 15 note tongue drum](https://riffspot.com/help/article/15-note-tongue-drum/))
- Hluru's free 15-note tabs give hand advice **in prose only**: in Canon in D, "let your left hand
  handle the lower notes (3, 2, 1) and your right hand handle the high melody", and notes "usually
  alternate left to right". The tabs themselves have no L/R.
  ([Hluru, 15-note sheet music: 3 advanced songs](https://www.hluru.net/en-us/blogs/skills-tips/15-note-tongue-drum-sheet-music-3-advanced-songs-free-tabs))
- Hluru's beginner tabs and notation guide: no hand markings; hand technique is only in the FAQ prose.
  ([Hluru, beginner tabs](https://www.hluru.net/en-us/blogs/skills-tips/tongue-drum-sheet-music-for-beginners-free-easy-tabs),
  [Hluru, how to read](https://www.hluru.net/en-us/blogs/skills-tips/how-to-read-tongue-drum-music-a-beginners-guide-to-notation))
- Publisher arrangements (Sheet Music Direct tongue drum editions) show numbers above/below the
  staff and say nothing about hands.
  ([Sheet Music Direct, tongue drum arrangement](https://www.sheetmusicdirect.com/se/ID_No/613921/Product.aspx))
- The nearest relative that *does* show hands is **handpan** tablature: "the notes at the top are
  played with the right hand", "the notes at the bottom are played with the left hand", i.e. hand
  by vertical position, not letters.
  ([Instruments du Monde, reading handpan tablature](https://instruments-du-monde.com/en/blogs/handpan/read-sheet-music-tablature-handpan))
- L/R letters above or below the note are the general percussion "sticking" convention (snare,
  mallet percussion), not a tongue drum one.
  ([OnMusic dictionary, sticking](https://dev-dictionary.onmusic.org/terms/3349-sticking))

**Bottom line:** a tongue drum player won't expect hand markings. If the app shows them, it is
adding something new, so it should be optional, and it can reuse the familiar percussion L/R
letters or a handpan-style top = right / bottom = left layout.

## 2. Two notes at once (chords)

- Instruments du Monde: "Some scores may include parentheses or dashes—for example, (16) or 1–6",
  which means play the notes at the same time. In their advanced example, melody and harmony are
  **separate lines read together**, with `0` for harmony rests.
  ([Instruments du Monde](https://instruments-du-monde.com/en/blogs/tongue-drum/how-to-read-tongue-drum-sheet-music))
- Handpan tab: "Notes placed at the same level are played at the same time" (vertical stacking).
  ([Instruments du Monde, handpan](https://instruments-du-monde.com/en/blogs/handpan/read-sheet-music-tablature-handpan))
- Publisher arrangements put chords in a separate score: "Chords Score #1 consists of 2-note
  chords that harmonize with the melody", with tongue numbers shown below the staff.
  ([Sheet Music Direct](https://www.sheetmusicdirect.com/se/ID_No/613921/Product.aspx))
- Riffspot prints chord **names** above the music ("may be simplified slightly"), not stacked numbers.
  ([Riffspot](https://riffspot.com/help/article/15-note-tongue-drum/))
- Beginner number-only books (Helen Winter / GOU-style "play by numbers") and Hluru's beginner
  tabs are **single-line melodies**; none of the beginner sources shows chords.
  ([Leanpub, Tongue Drum Songbook for Beginner](https://leanpub.com/tongue-drum-songbook-for-beginner),
  [Hluru, 10 beginner songs](https://www.hluru.net/en-us/blogs/skills-tips/free-tongue-drum-sheet-music-10-beginner-songs-full-pdf-download))

**Bottom line:** two-notes-at-once is rare in beginner material. Where it appears, the inline form
is `(16)` / `1-6` (note: `-` here clashes with `-` = "hold" in other sheets).

## 3. Rhythm

Three levels are in use, from least to most detail:

1. **Nothing, or spacing only.** "We do not show the note duration -- we just group the circles
   closer to each other to show the rhythms. You can experiment with duration on your own."
   ([Leanpub, Helen Winter, Tongue Drum Songbook for Beginner](https://leanpub.com/tongue-drum-songbook-for-beginner)).
   Instruments du Monde: simple scores "don't indicate note duration, rests, or tempo".
   Common in the best-selling beginner books.
2. **Bar lines + dash-hold + 0-rest (plain jianpu).** Hluru: `1 - - -` = "strike the note 1 and
   let it ring for 4 counts"; `0` = rest; bars separated by `|`, `||` ends a section.
   ([Hluru, how to read](https://www.hluru.net/en-us/blogs/skills-tips/how-to-read-tongue-drum-music-a-beginners-guide-to-notation))
   Instruments du Monde "advanced" scores add time signature, BPM, bar numbers, ties and
   augmentation dots. Common in web tabs.
3. **Underlines for short notes** (jianpu): "A line underneath a number indicates it is half the
   duration (an eighth note). Two lines mean a sixteenth note." (Hluru). Instruments du Monde
   describes bars below a number the same way. These marks **disappear in copy-pasted text**:
   Hluru's own example shows up as plain `1 2` once extracted.
4. **Staff notation alongside the numbers** in publisher arrangements and Riffspot. Riffspot's
   tablature has no rhythm of its own; it says readers "will also benefit from the ability to
   read notation to help with the rhythms".

One more variant: a Helen Winter book ("Simple Beats") marks duration by the number of
parentheses after each circle, more parentheses meaning longer (from its listing; I couldn't
see a preview to confirm the exact glyphs).
([Gumroad listing](https://helenwinter.gumroad.com/l/simple-beats-62-tongue-drum-songs))

## 4. Plain-text form and octave dots

The plain-text form people copy is **numbers separated by spaces, with `|` bar lines**:

```
Twinkle (Hluru beginner tabs):
1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 -

Ode to Joy, section A (Hluru 10 beginner songs):
3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3 2 2

Spirited Away "Always With Me" (Hluru 15-note advanced):
5 6 1 5 | 3 1 5 3 | 2 3 4 2 | 3 1 6 | 5 6 1 1 | 7 6 7 1 | 2 3 2 5 1 1 ||
```

Octave dots in text are **not standardised**:

- Unicode combining dots: `1̇` (high, U+0307) and `1̣` (low, U+0323) (Hluru guide).
- `1°` or `1*` for a high note: "the dot may be replaced by '°' or '*'" (Instruments du Monde).
- **Often just dropped**: in Hluru's copied tabs the octave marks are gone (the Ode to Joy key
  says "1 = High Octave (Dot above)" but in the text it's just `1`; a high-note example comes
  through as `i`). The Spirited Away tab mixes octaves with no visible marks.
- Some 8-note books avoid octave dots altogether by numbering up to `8` (the high 1).
  ([Instruments du Monde](https://instruments-du-monde.com/en/blogs/tongue-drum/how-to-read-tongue-drum-sheet-music))
- Hluru uses a colon `:` / "double dot" for a second octave up ("Super High") on large drums.

No source used `'` / `,` (ABC style) or `_` for octaves. The app's own tokens (`_3`, `˙1` in
`notes.js`) are its own variant: `˙` (U+02D9, a spacing dot) is close to the combining-dot form.

## Implications for the app (not decisions)

- **Hand hints** would be new to players. Nothing in existing sheets has to match, so the app is
  free to choose (e.g. L/R or colour), but they should be optional.
- **Chords** can be left for later: beginner sheets almost never use them. If they're added,
  `(16)` is the most recognisable inline form.
- **Rhythm:** the minimal, recognisable set is `|` bar lines, `-` hold, `0` rest. Underlines
  don't survive plain text.
- **Pasting songs in:** expect space-separated digits with `|`, and expect octave marks to be
  missing or written in several ways (`˙`/combining dot, `°`, `*`, `:`), so octaves may need
  guessing or a manual fix after pasting.

## Gaps

- I couldn't open any drum maker's bundled PDF songbook (most are paid or behind stores), so
  beginner books were judged from listings and previews.
- No Reddit/community tab threads came up in search, so "what people paste" rests on maker/seller
  blogs (mainly Hluru) rather than forum posts.
- Chinese 空灵鼓 (tongue drum) jianpu sheets were not checked directly. Searching turned up only
  general percussion L/R conventions.
