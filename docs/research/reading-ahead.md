# Reading ahead: does seeing the next few notes help a beginner?

Research for [Does seeing the next few notes help a beginner read without looking at the drum?](https://github.com/filkata123/tongue_drum_learning/issues/14),
part of the map [#1](https://github.com/filkata123/tongue_drum_learning/issues/1). It builds on
[How do beginners learn to play from notation without looking at the instrument?](https://github.com/filkata123/tongue_drum_learning/issues/3)
(findings: `docs/research/sight-reading-without-looking.md` on branch `research/sight-reading-without-looking`)
and does not repeat it.

Question: should the app show more of the **Song sheet** than the current step? How far ahead is
useful for a beginner, and should that grow with skill? Is hiding upcoming notes (or the
current one) a known training technique?

Researched 2026-10-20. Each claim links to its primary source. Where only the abstract was
readable (paywall), that is said. Points marked **Inference** are my reading of how a finding
applies to this app. The sources do not test them directly.

## Short answer

1. **Seeing a little ahead helps, and too little hurts. More than that adds little.** Cutting
   the view down to almost nothing slows everyone, beginners included. Beyond a short stretch
   (about one bar in music, about 7 characters in typing), extra view does not speed people up.
2. **How far you *actually* read ahead grows with skill, but it follows from skill. Showing more
   does not cause it.** Beginners' eyes run about 1–2 notes ahead of their hands; experts run about
   4 or more. In time it is about one second for both. Faster typists use more preview *because*
   they are faster.
3. **A good reader adjusts how far ahead they look.** They look less far ahead on hard passages
   and further on easy ones. Looking further ahead is not always better.
4. **Hiding or moving the notes is a recognised training family ("controlled reading").** A
   meta-analysis of 92 studies counted it among the four kinds of practice that reliably helped
   sight-reading, though the overall effect of all practice methods is small. I found no
   controlled study of "erase the note you're on" for beginners.
5. **For this app:** show a short stretch (the current step plus the next 2–3 steps, the
   current bar at most), make the current step clearly the biggest, and don't hide anything in
   Step mode. If hiding is used at all, it belongs in Timed mode, where the beat pushes you to
   read ahead.

## 1. Does seeing more than the current note help?

- **Eye-hand span** is how far your eyes are ahead of what your hands are playing. Pianists
  sight-read single-line melodies through a "moving window" that showed only 2, 4 or 6 beats around
  where they were looking, or the full score. With only **2 beats visible**, playing was slowest,
  with more fixations and more looking back. 4 beats, 6 beats and the full score did not differ:
  "pianists need to see no more than the whole measure that they are fixating". Their eyes
  ran "a little more than one beat" ahead. **Window size did not interact with skill:** the tiny
  window hurt the weaker readers as much as the strong ones. (Abstract only.)
  [Truitt, Clifton, Pollatsek & Rayner 1997, *Visual Cognition* 4(2)](https://doi.org/10.1080/713756756)
- A later moving-window study put the useful view at about **2–4 beats** to the right of where
  the reader is looking. That useful view did *not* change with expertise or score difficulty,
  although eye-hand span did. (As summarised in the Perra et al. review below.)
  [Gilman & Underwood 2003, *Visual Cognition* 10(2)](https://doi.org/10.1080/713756679)
- **Typing shows the same pattern.** Typists (17–104 words per minute) typed with 1, 3, 5, 7,
  9, 11 or 19 upcoming characters visible. Speed stayed near normal with about 7 or more and
  dropped as the preview shrank below that. With 1 character, every keystroke becomes a fresh
  "see it, find it" reaction. (Full text paywalled. The preview sizes and threshold come from
  summaries of the paper.)
  [Salthouse 1984, *J. Exp. Psychol.: General* 113(3)](https://doi.org/10.1037/0096-3445.113.3.345);
  earlier, Shaffer & Hardwick reported no loss until fewer than ~8 characters were visible, as cited in
  [Ostry 1983, ch. 9 of *Cognitive Aspects of Skilled Typewriting*](https://www.psych.mcgill.ca/labs/mcl/pdf/typing1983.pdf)

**Evidence strength:** moderate. The pattern is consistent across music and typing. The music
studies are small (8–20 pianists) and used trained pianists, not first-month beginners.

**Inference:** showing only the current note is the "1-character" case. It turns each step into
a separate reaction and gives nothing to plan the next strike with. The app's current "one big
number plus a small next" already escapes the worst case. A short row of 3–4 steps is enough.
A whole song on screen adds little and costs space and focus.

## 2. How far ahead is useful for a beginner, and does it grow?

- **Professionals vs amateurs (pianists):** the professionals' eyes were about **4 notes** ahead,
  the amateurs' about **2**. Measured in *time*, both were about **1 second** ahead. Faster tempo
  shrank it to ~0.7 s and slower tempo stretched it to ~1.3 s, for everyone. So skill shows up as
  more notes fitting into the same second, not as looking further ahead in time.
  [Furneaux & Land 1999, *Proc. R. Soc. B* 266](https://doi.org/10.1098/rspb.1999.0943)
- **Review of 15 eye-hand span studies (mostly piano):** across studies, less skilled readers'
  eyes were **0.5–3.7 notes** (0.75–2.1 beats) ahead and skilled readers' **1.7–6.8 notes**. The
  span "increases in line with the musician's expertise level" and "diminishes as a function of the
  complexity of the score". In one study, all players had a *zero* span about 30% of the time
  whatever their level.
  [Perra, Poulin-Charronnat, Baccino & Drai-Zerbib 2021, *J. Eye Movement Research* 14(4)](https://doi.org/10.16910/jemr.14.4.4)
- **Looking further ahead is a strategy, not a score.** In 30 professional pianists, the best
  players used a long span on easy, slow music but a *shorter* one on hard, fast music. In the
  least accurate group, a longer span went with *more* errors. The authors: eye-hand span "is not a
  decisive indicator of sight-reading proficiency". Good readers are "skilled at adjusting" it.
  [Lim et al. 2019, *Scientific Reports* 9:17906](https://doi.org/10.1038/s41598-019-54364-y)
- **Typing:** faster typists use a larger preview. Salthouse treats that as a *consequence* of
  faster processing, not its cause: you only need to see further ahead once your fingers can keep up.
  [Salthouse 1984](https://doi.org/10.1037/0096-3445.113.3.345) (via summary; full text paywalled)
- **What limits it:** in 39 experienced pianists, auditory working memory (holding sounds in
  mind) predicted how far ahead they read, and that in turn predicted performance. Easier scores
  allowed a longer span. No beginners were tested.
  [Imai-Matsumura & Mutou 2023, *PLoS ONE* 18(5)](https://doi.org/10.1371/journal.pone.0285043)

**Evidence strength:** moderate that span grows with skill and shrinks with difficulty. Weak
for true beginners: almost every study uses trained pianists, and "less skilled" usually means
less skilled *pianists*.

**Inference:** a beginner can use about **1–2 steps ahead**. Showing 2–3 upcoming steps covers that
with room to grow. There is no evidence that showing *more* makes someone read further ahead.
How far ahead they read follows from how fast and sure their hands are. So the window does not
need to grow with skill. A fixed short stretch is fine. On hard spots (chords, octave jumps
like `3` / `˙3`), even good readers pull their eyes back to the current note. So the current step
must always be the easiest thing to find on screen.

## 3. Is hiding upcoming (or current) notes a training technique?

- **Yes, as a family.** A meta-analysis of 92 sight-reading intervention studies found a small
  overall effect for training (d = −0.18 in its sign convention). Only the *type* of training
  mattered: "Aural Training", "Controlled Reading", "Creative Activities" and "Singing/Solfege"
  each "significantly and positively" affected sight-reading. ("Controlled reading" covers
  methods that control what part of the music is visible and when, such as flashed or moving
  displays. The definition is from the paper's category name, not checked in the paywalled full
  text.)
  [Mishra 2014, *Psychology of Music* 42(2)](https://doi.org/10.1177/0305735612463770)
- **Short practice changes reading-ahead a little, and mainly for weaker readers.** After repeating
  a piece four times with two minutes' practice between, only the less skilled readers improved, and
  their span rose to the skilled readers' level. That is learning *that* piece, not a general skill.
  [Cara 2018, *Musicae Scientiae* 22(3)](https://doi.org/10.1177/1029864916687601) (as reported in
  Perra et al. 2021). In contrast, 30 minutes of practice did not lengthen the span in another
  study. [Rosemann, Altenmüller & Fahle 2016, *Psychology of Music* 44(4)](https://doi.org/10.1177/0305735615585398)
  (as reported in Perra et al. 2021).
- **Erasing the bar you're on** ("read ahead" apps that wipe each bar as you start it, forcing your
  eyes forward) is taught by conservatory teachers, but I found **no controlled study** of it,
  and none with beginners. The classic way to *measure* span, switching the score off mid-play and
  counting how many notes the player still gets right, is a test, not a proven training method.
  [Sloboda 1974, *Psychology of Music* 2(2)](https://doi.org/10.1177/030573567422001)
- **Too little view hurts the reading itself.** The 2-beat window slowed everyone and caused
  more looking back ([Truitt et al. 1997](https://doi.org/10.1080/713756756)). Hiding too much is
  not neutral.

**Evidence strength:** weak to moderate. "Controlled reading" helps as a category, but the
studies are mostly old, quasi-experimental and with school or college musicians. There is
nothing direct on fading the *current* note for a beginner.

**Inference:** forcing your eyes ahead only pays off when something keeps you moving, such as a
beat or an accompaniment. In **Step mode** the app waits for you, so there is no pressure to read
ahead, and hiding notes would just remove information. In **Timed mode** the beat goes on.
A later step could dim or remove a step once it has passed, or even as it starts. That is a
"controlled reading" exercise, but it is unproven and should come only after the basics.

## 4. Does reading ahead help with *not looking at the drum*?

No study tests this directly. Two links, both **Inference**:

- Trained typists slide back to looking at the keys when that pays off right now, and giving
  them a reason to keep their eyes on the screen reduced it
  ([Yechiam et al. 2003](https://doi.org/10.1518/hfes.45.4.671.27085), from the earlier research).
  A short preview gives the eyes something useful to do on the phone between strikes, instead
  of drifting down to the drum.
- If the eyes are ~1 s ahead, the hands are working from memory of what was just read. That is
  exactly "read a number, hit the tongue, without looking". A one-note display gives no such
  lead. When the learner looks down for a hard tongue, they lose their place. A visible
  stretch with a clear "you are here" makes it quicker to find it again.

## What the app should do or avoid

Strongest first:

1. **Show a short stretch, not one note and not the whole song:** the current step plus the
   next **2–3** steps (or the current bar, whichever is shorter on a phone). For a two-line sheet,
   show the same stretch of both lines stacked, so a chord reads as one column.
2. **Keep the current step dominant:** biggest, highest-contrast, fixed position. Upcoming steps
   smaller or dimmer. Beginners' eyes sit on or one step past the current note, and everyone's
   eyes pull back on hard notes.
3. **Don't grow the window with skill, and don't hide anything in Step mode.** No evidence says a
   bigger window trains reading ahead. Reading ahead grows with how fast the hands are. Step mode
   waits for you, so hiding only removes help. This also keeps "just press Start": no setting.
4. **Optional, later, Timed mode only:** remove a step once it has passed (cheap and harmless). Maybe
   later fade the *current* step as it starts, as a "read-ahead" exercise. Treat it as an
   experiment: the training family has support, this exact form does not.
5. **Avoid:** previews so small the learner keeps losing their place (the 2-beat-window
   effect), and scrolling that moves the current step around the screen.

## Sources not reachable in full

Salthouse 1984, Gilman & Underwood 2003, Truitt et al. 1997, Mishra 2014, Sloboda 1974,
Cara 2018 and Rosemann et al. 2016 are paywalled. Their figures come from the abstract (Truitt, Mishra
via Crossref) or from the open-access review by Perra et al. 2021 and the Lim et al. 2019 paper,
which report them. The Salthouse preview sizes come from summaries.
