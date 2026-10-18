# Learning to play from notation without looking at the drum

Research for [#3](https://github.com/filkata123/tongue_drum_learning/issues/3), part of map [#1](https://github.com/filkata123/tongue_drum_learning/issues/1).
Question: what does motor-learning and music-learning research say about reading a number in
**Number notation** and hitting the right **Tongue** without looking? Specifically: do location aids
help or hurt, does fading them work, and how do feedback timing and practice order matter?

Researched 2026-10-18. Every claim is linked to a primary source (the paper itself, or its
abstract where the full text is paywalled). Points marked **Inference** are my reading of how
a finding applies to this app. The sources do not test them directly.

## Short answer

1. **A location aid that is always on probably holds back learning to play without it.** The
   effect is real but modest, and almost all the evidence comes from lab tasks rather than drums.
   Concurrent guidance (being shown *where* to hit while you play) makes practice look better
   and can make performance worse once the guidance is gone.
2. **If the app shows where a tongue is, show it late and less often.** It could appear only after
   a pause or a miss, and fade per tongue as that tongue gets reliable. This "time delay" pattern
   is well established for teaching recognition skills. One small 2026 piano study found adaptive
   fading beat a fixed-strength cue on short-term retention.
3. **Keep the right/wrong signal after each strike.** The broad claim that "less feedback is
   better" does *not* hold up in recent meta-analyses. The thing to avoid is the location
   *prompt*, not the result signal.
4. **Mix things up, and don't trust how practice feels.** Interleaved or random order beats
   repeating one thing, and musicians wrongly feel that repetition worked better. The effect is
   smaller for beginners and outside the lab, so start a new melody with some repetition and mix
   more as it gets easier.
5. **Some looking is normal.** Even trained touch typists look at the keyboard about 20% of the
   time, and pianists glance at their hands while sight-reading. Aim for less looking, not none.

## 1. Do visual location aids help or hurt?

### The guidance hypothesis

- The classic review of feedback ("knowledge of results") argued that feedback which guides
  every attempt makes practice performance better but builds dependence on it. Learners do worse
  when it is taken away, which is the "guidance hypothesis".
  [Salmoni, Schmidt & Walter 1984, *Psychological Bulletin*](https://doi.org/10.1037/0033-2909.95.3.355)
- Showing the movement live *while* it happens (concurrent feedback) is the strongest case.
  In two experiments it improved practice, but in next-day retention tests it "interfered with the
  learning of an accurate motor program".
  [Schmidt & Wulf 1997, *Human Factors*](https://doi.org/10.1518/001872097778667979)
- A large review of visual, auditory and haptic feedback calls the best way to give augmented
  feedback "controversial". Its answer depends on task complexity: concurrent guidance tends to
  help complex tasks more than simple ones.
  [Sigrist, Rauter, Riener & Wolf 2013, *Psychonomic Bulletin & Review*](https://doi.org/10.3758/s13423-012-0333-8)

**Evidence strength:** moderate. The idea is decades old and widely replicated, but mostly in
simple lab tasks (positioning, timing), not instruments.

### Lit keys and falling-note apps

- I found **no controlled study** that tests Synthesia, Simply Piano, or lit-key keyboards with a
  retention test without the lights. What turns up is vendor claims and patents, which are not
  evidence.
- The projected piano-roll system P.I.A.N.O. reported faster learning and lower load than sheet
  music. It measured performance *with* the projection, though, not playing without it.
  [Rogers et al. 2014, Ulm University](https://www.uni-ulm.de/fileadmin/website_uni_ulm/iui.inst.100/1-hci/hci-paper/2014/2014-gugenheimer-piano.pdf)
- The closest direct test is a VR piano study (N=30, within-subjects, CHI 2026). Learners were
  tested without guidance. A "ghost hand" that stayed half-visible all the time
  gave retention scores that fell (pitch accuracy 96.8% right after practice, 87.8% after 10 min).
  A ghost hand that faded as the learner got it right held up (99.1% to 99.6%), with somewhat lower
  workload. The retention gap was only 10 minutes, and the authors note that.
  [Hsieh, Visser, Eisemann & Marroquim 2026, arXiv:2603.06253 / CHI 2026](https://arxiv.org/abs/2603.06253)

**Evidence strength:** weak to moderate. One small, short-term study points the same way as the
guidance hypothesis.

### Looking at the instrument is normal, and people slide back to it

- Eye tracking of 30 everyday typists: touch typists looked at the keyboard **20%** of the time,
  self-taught typists **40%**, and more looking went with slower typing. A *consistent* finger-to-key
  mapping was one of three predictors of speed.
  [Feit, Weir & Oulasvirta 2016, CHI](https://userinterfaces.aalto.fi/how-we-type/resources/HowWeType_CHI16.pdf)
- People trained to touch-type often go back to looking at the keys in everyday use, because
  looking gives better results *right now*. Making the screen worth watching (a task that needed
  attention on the screen) reduced that slide.
  [Yechiam, Erev, Yehene & Gopher 2003, *Human Factors*](https://doi.org/10.1518/hfes.45.4.671.27085)
- Pianists glance at the keyboard while sight-reading to check where their hands are, and use the
  sound to confirm they played the right notes. (Abstract only; full text is paywalled.)
  [Banton 1995, *Psychology of Music* 23(1)](https://doi.org/10.1177/0305735695231001)

**Evidence strength:** moderate for typing. Typing is the closest well-studied "hit the right
target without looking" skill.

## 2. Fading aids out

- **Time delay** (special education): the prompt comes immediately at first, then only after a
  wait, so the learner gets a chance to answer first. A review of 22 studies found the version where
  the delay grows over time had fewer errors and handed control to the learner sooner than a fixed
  delay. Reviews of 30+ single-case experiments rate time delay evidence-based for teaching sight-word
  recognition, which has the same "see symbol, give answer" shape as reading a number.
  [Walker 2008, *J. Autism Dev. Disord.*](https://doi.org/10.1007/s10803-007-0390-4);
  [Browder et al. 2009, *Exceptional Children*](https://doi.org/10.1177/001440290907500305)
- **Vanishing cues** (memory research): cut a hint down step by step across attempts until it is
  gone. Learners eventually produced answers with no cue and kept them for 6 weeks. This was a
  small study with memory-impaired patients.
  [Glisky, Schacter & Tulving 1986](https://doi.org/10.1080/01688638608401320)
- **Adaptive fading** (VR piano, above): guidance strength tracked a smoothed error score. It faded
  quickly when the learner did well and came back slowly after slips.
  [Hsieh et al. 2026](https://arxiv.org/abs/2603.06253)
- **Showing feedback less often overall is not reliably better.** A pre-registered meta-analysis of
  61 papers (N=2228) found "no significant effect of reduced feedback frequency at any time point",
  and the studies were "severely underpowered". The textbook result (50% feedback beats 100%;
  Winstein & Schmidt 1990) has not held up as a general rule.
  [McKay et al. 2022, *Psychology of Sport and Exercise* (preprint)](https://doi.org/10.31234/osf.io/v2cp7)
- **Letting the learner choose when to get help** (self-controlled feedback): one 2025
  meta-analysis reports a benefit, but a bias-corrected meta-analysis concluded the effect is "not
  currently distinguishable from zero", and a direct replication failed.
  [McKay et al. 2022, *Meta-Psychology*](https://doi.org/10.15626/MP.2021.2803);
  [Yantha, McKay & Ste-Marie 2022, *J. Sports Sci.*](https://doi.org/10.1080/02640414.2021.2015945);
  [2025 meta-analysis, *Behavioral Sciences*](https://doi.org/10.3390/bs15091291)

**Evidence strength:** good for time delay, though in a different field and population. Weak for
"reduced frequency" and "self-controlled" as learning boosters.

## 3. Feedback timing and practice order

- **Random or interleaved beats blocked repetition for retention, with caveats.** A 2024
  meta-analysis of 54 studies found a medium benefit overall. In applied (non-lab) settings it was
  "almost negligible", and for young learners it was negligible.
  [Czyż et al. 2024, *Scientific Reports*](https://doi.org/10.1038/s41598-024-65753-3)
- **Musicians:** pianists practised melodies in fixed or random order. Fixed order was faster
  during practice, random order was faster at a 2-day retest, and the pianists *believed* fixed
  order had worked better.
  [Abushanab & Bishara 2013, *Memory & Cognition*](https://doi.org/10.3758/s13421-013-0311-z)
  The same misjudgement appears for keypad sequences.
  [Simon & Bjork 2001, *JEP: LMC*](https://doi.org/10.1037/0278-7393.27.4.907)
  Clarinettists (N=10) rated interleaved practice better and reported better focus.
  [Carter & Grahn 2016, *Frontiers in Psychology*](https://doi.org/10.3389/fpsyg.2016.01251)
- **How hard to make it depends on skill level** (the "challenge point" idea): the right amount of
  difficulty from mixing and from feedback goes up as the learner improves, so beginners need less.
  [Guadagnoli & Lee 2004, *J. Motor Behavior*](https://doi.org/10.3200/JMBR.36.2.212-224)

**Evidence strength:** moderate. The direction is consistent, but effects shrink outside the lab
and for novices.

## What the app should do or avoid

The current app has no location aid. It shows the number, turns green on a hit, and shows the
note you played on a miss. Recommendations, strongest first:

1. **Keep the hit/miss signal and "what you played".** It is feedback after the strike, not a
   location prompt, and the evidence for cutting it back is weak. The drum's own sound is extra
   feedback for free.
2. **If a drum map or "where is this tongue" hint is added, make it late and earned.** Show it
   only after a pause with no strike (start around 2–3 s) or after a miss, and lengthen the delay
   for a tongue as it gets reliable (progressive time delay). Never show it before the learner has
   had a go. **Inference** from time delay plus the guidance hypothesis. The exact timings are
   guesses to tune.
3. **Fade per tongue, not globally.** Keep a running miss/slow score for each of the 15 tongues.
   Reliable tongues lose their hint, and troublesome ones keep it longer (the adaptive pattern in
   Hsieh et al.). This also produces data for a "notes often missed" progress view.
4. **Avoid falling-note or "next tongue lights up" styles as the main mode.** They are the
   concurrent-guidance case the research warns about, and nobody has shown they transfer to playing
   without them.
5. **Keep the eyes on the screen by making it worth watching.** The next-note preview helps,
   because getting ready for the next stroke predicted fast typing. Don't try to detect or punish
   glances (Yechiam: people slide back to looking because it pays off right away).
6. **Mix the order once a melody is roughly known.** A new melody can be repeated a few times
   (beginner, challenge point). After that, mix melodies and short random-number drills instead of
   looping one. Random sequences matter for this goal in particular: a memorised melody can be
   played from sequence memory without reading the numbers. **Inference.**
7. **Measure progress on a cold first try, not in-session streaks.** Practice performance
   overstates learning, and learners misjudge it. A "first attempt today" accuracy per melody or
   tongue is a more honest progress signal. **Inference** from the retention-test findings.
8. **An optional "show me" button is fine but not a learning booster.** The evidence for
   self-controlled help is weak. It doesn't break the standing rule ("just press Start") because it
   adds nothing before play starts.
9. **Possible extra:** a consistent hand or **Mallet** for each tongue (e.g. left side, left
   mallet) may help, by analogy with consistent finger-to-key mapping in typing. **Inference only**,
   untested for drums.

## Gaps

- No study tests tongue drums, or any instrument with lit cues, over days with a no-cue test.
- The fading evidence comes from special education and a single VR piano study. The delay values
  have to be tuned by trying them.
- The reduced-feedback and self-controlled literatures are badly underpowered. Treat their
  textbook claims with caution.
