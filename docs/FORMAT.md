# The Chords format (`.chords`), version 1

A plain-text way to write a song's chords, rhythm, lyrics and band cues. It's built to be
**quick to type** (on a phone too), **easy to read as plain text**, and **easy for Claude to
write** in one go. The Chords app imports it: paste the text or choose a `.chords` file.

If you only read one thing, read the example below; most of it explains itself.

```
title: Harbour Lights
artist: The Example Band
key: G
tempo: 92
time: 4/4
*hit: ▲ Band hit together

[Intro]
| G . . . | Cadd9 . . . | Em7 . D . | Cadd9 . . . | x2

[Verse 1]
| G . . . | D/F# . . . | Em7 . . . | C . . . |
The ^harbour lights are | ^fading out to | ^sea, and I'm | ^still here

[Pre-chorus]
| Am7 . . . | C . . . | Am7 . . . | D!*stop . - . |
So ^hold on | ^tight now | ^hold on | ^Stop!

[Chorus]
| G . . . | D . . . | C . [D C] . | G . . . |
^Harbour lights, | ^show me the | ^way back ^home ^to|^night

[Verse 2]
| G . . . | D/F# . . . | Em7 . . . | C . . . |
The ^tide is turning | ^slowly in the | ^dark, and the | ^gulls cry

[Chorus x2]

[Bridge]
> Half time feel
{3/4}
| Em . . | C . . | G . . | {4/4} D*hit . D*hit D*hit |
```

---

## 1. The shape of a file

A file is made of lines. **What a line starts with decides what it is:**

| Line starts with | It is | Example |
|---|---|---|
| `name: value` (at the top) | Header: facts about the song | `key: G` |
| `*name:` | A notation of your own (see 7) | `*hit: ▲ Band hit` |
| `[` | A section | `[Chorus x2]` |
| `\|` | A line of bars | `\| G . . . \| C . D . \|` |
| `{` | An instruction: time, key, tempo, repeating notation | `{3/4}` |
| `>` | A cue for the band, shown in the chart | `> Drums only` |
| `//` | A comment, never shown | `// check the bridge` |
| `---` | The start of the next song (one file can hold a whole set) | `---` |
| anything else | Lyrics for the bar line just above | `The ^harbour lights` |

Blank lines are fine anywhere. A blank line ends the lyrics for the bar line above it.

## 2. Header

`name: value` lines at the very top, before the first section or bar line.

| Name | Meaning | Example |
|---|---|---|
| `title` | The song's name | `title: Harbour Lights` |
| `artist` | Who it's by | `artist: The Example Band` |
| `key` | The key: `G`, `Em`, `Bb`, `F#m`. Needed for numbers (see 5) and for good spelling when transposing | `key: Bb` |
| `tempo` | Beats per minute | `tempo: 92` |
| `time` | Time signature; `4/4` if left out | `time: 6/8` |
| `capo` | Capo fret, shown on the chart | `capo: 2` |
| `notes` | A line of notes shown under the title | `notes: Count in with sticks` |

Any other `name: value` is kept and ignored, so you can add your own (`arranged: Sam`).

## 3. Sections

`[Name]` starts a section: `[Intro]`, `[Verse 1]`, `[Chorus]`, `[Bridge]`, `[Solo]`, `[Outro]`,
or any name you like.

- `[Chorus x2]` plays the section twice.
- **A section with nothing under it plays the last section with the same name again.** Write
  the chorus once, then just `[Chorus]` each time it comes back.

## 4. Bars and beats

A line of bars starts with `|`. Bars are separated by `|`.

**The chords in a bar share it equally.** So write one thing per beat:

| You write (in 4/4) | It means |
|---|---|
| `\| G \|` | G for the whole bar |
| `\| G C \|` | G for 2 beats, C for 2 beats |
| `\| G . . . \|` | G for 4 beats (`.` holds the chord for a beat) |
| `\| G . C . \|` | G for 2 beats, C for 2 beats |
| `\| G . . C \|` | G for 3 beats, C on beat 4 |
| `\| - . C . \|` | No chord for 2 beats (`-` is N.C., silence), then C |
| `\| % \|` | The same as the bar before |

`/` also works as a hold (`| G / / / |`), and `N.C.` as no chord.

**Splitting a beat: `[ ]`.** Square brackets squeeze several chords into the space of one:

| You write (in 4/4) | It means |
|---|---|
| `\| C . [D C] . \|` | C (2 beats), D and C half a beat each on beat 3, then hold |
| `\| G [G C] . . \|` | a quick change on the "and" of beat 2 |
| `\| [C [D E]] \|` | brackets nest: C for half the bar, D and E a quarter each |
| `\| C . . [. D] \|` | D pushed onto the "and" of beat 4 |

The app warns if a bar's count doesn't fit the time signature (3 things in a 4/4 bar), because
it's usually a typo. Use `.` to fill beats or `[ ]` to squeeze.

**Repeats:**

- `x2` (or `x3`…) after the last `|` plays that line again: `| G | C | x2`
- `|: G | C :|` also repeats the line (twice, unless you add `x3`).

## 5. Chords

Write chords the usual way. The root is `A`–`G` with `#` or `b`, then anything for the
chord's quality, then `/bass` if there is one:

`G` `Em` `F#m7` `Bbmaj7` `Dsus4` `C6/9` `E7#9` `Am7b5` `Cdim` `Caug` `Cadd9` `D/F#` `G/B`

**Nashville numbers** work too, so a chart plays in any key: `1` `4` `5` `6m` `2m7` `b7` `5/7`
`4maj7` `1/3`. Numbers count up the major scale from the song's `key:` (in G: `1`=G, `4`=C,
`5`=D, `6m`=Em, `b7`=F). Numbers need a `key:` in the header. In the app, **Chords / 1 4 5**
switches any chart between letters and numbers, and transposing moves letters (numbers stay
the same, because they're relative to the key).

## 6. Lyrics

Write the words on the line straight under the bar line. **Put `^` just before the syllable
where each chord lands.** The `^` marks go to the chords in order, moving into the next bar
when a bar's chords run out (holds `.` don't count, `-` does).

```
| G . C . | D . . . |
I ^walked a^long the ^road
```

G lands on "walked", C on "long", D on "road". "I" is sung before the first chord.

**Optional: `|` in the words** says where each bar starts, which keeps long lines lined up.
The `^` marks in each piece then belong to that bar:

```
| G . . . | D/F# . . . | Em7 . . . | C . . . |
The ^harbour lights are | ^fading out to | ^sea, and I'm | ^still here
```

A piece without a `^` starts on that bar's first chord.

**Two or more lyric lines under one bar line** are shown one after another, for a line that
repeats with new words (`x2`).

**Words on their own** (with a blank line above them, or before any bars) are shown as text.

## 7. Notations

Put notations right after a chord, `.`, or `-`, with no space:

| You write | It means |
|---|---|
| `D!` | Accent: hit it |
| `D*stop` | Band stops (on that beat) |
| `.*push` | a notation on a held beat |
| `G*"Drums out"` | your own words, in quotes |
| `D!*stop` | several at once |

**Built in** (no need to define): `*accent`, `*stop`, `*push`, `*hold`, `*fill`, `*solo`,
`*drums`, `*build`, `*quiet`, `*loud`.

**Your own:** define them in the header with `*name: label`, optionally starting with a symbol:

```
*hit: ▲ Band hit together
*gtr: ♪ Guitar riff
*keys: Keys only
```

then use them anywhere: `| G*gtr . . . |`. The chart shows the symbol over the chord and a
legend under the title. An undefined name still works; the app just shows its name.

**Notations at regular intervals:** `{every …}` puts a notation on every few bars or beats,
from there to the end of the section (or until `{every off}`):

```
{every 4 bars *"crash"}
{every 2 beats *clap}
{every off}           // stops them all
{every off *clap}     // stops one
```

## 8. Time, key and tempo changes

Instructions in `{ }` change things from the next bar on, either on a line of their own or at
the start of a bar:

```
{3/4}
| Em . . | C . . |
| {2/4} D . | {4/4} G . . . |
{key: A}
{tempo: 140}
```

`{time: 7/8}`, `{key: Bbm}`, `{120 bpm}` also work. Time and key carry on into later sections
until they change again. After `{key: …}`, numbers are counted from the new key.

## 9. Cues and comments

- `> Half time feel` shows in the chart, in italics, where it is. Use it for anything the band
  should read: who plays, feel, dynamics, "watch the singer".
- `// …` is a comment for whoever edits the file; it's never shown. It can also go at the end
  of a bar line: `| G | C | // check this`.

## 10. Several songs in one file

Separate songs with a line of three dashes, `---`. The app adds each as its own song. Handy
for asking Claude for a whole set at once.

**A set list file** starts with a comment naming the set, then each song after `---`:

```
// Set: Friday at The Anchor
---
title: Harbour Lights
…
---
title: Numbers Game
…
```

Importing it adds the songs and makes the set, in that order. **Share as one file** on a set
writes exactly this, so the band can pass sets around. (Ask Claude for a set the same way:
"start with `// Set: name`".)

## 11. Mistakes

The app never refuses a file. Anything it can't read is shown as written, and **Things to
check** (in the chart) or the editor lists each problem with its line number:

- a chord it can't read (`Hm`, a typo);
- a bar with a count that doesn't fit the time signature;
- `[` without `]`, an unclosed `"` or `{`;
- more `^` marks than chords;
- numbers without a `key:`.

## 12. Quick reference

```
title: …   artist: …   key: G   tempo: 120   time: 4/4   capo: 2   notes: …
*name: ▲ Label            your own notation
[Section]  [Section x2]   empty [Section] = play it again
| G . . . | C . D . |     bars; one thing per beat; . = hold
-   N.C.                  no chord
%                         repeat the bar before
[D C]                     two chords in one beat; brackets nest
x2   |: … :|              repeat the line
1 4 5 6m b7 5/7           Nashville numbers (needs key:)
lyrics ^under the ^chords   ^ = where each chord lands; | in words = new bar (optional)
G!  G*stop  G*name  G*"text"   notations
{3/4} {key: A} {tempo: 90}     changes from the next bar
{every 4 bars *crash}  {every off}
> cue for the band
// comment
---                       next song
```

---

## Asking Claude for a chart

Paste this into a chat with Claude (the app's **Guide** tab has a **Copy the prompt** button
with the same text), then the song name. Paste Claude's answer into the app (**Songs → +**).

> Write a chord chart in the **Chords format** described below. Reply with only the chart in
> one code block, no explanation. If you aren't sure of a chord or a lyric, write your best
> guess and add a `// check` comment on that line. Don't write out full copyrighted lyrics:
> give the first few words of each line followed by `…`, unless I've given you the words.
>
> *(then the quick reference above, and this:)*
>
> Rules: one thing per beat in each bar (`.` holds), `[ ]` splits a beat, sections in `[ ]`,
> an empty `[Chorus]` repeats the chorus, `^` in lyrics marks where each chord lands, time and
> key changes as `{3/4}` / `{key: A}` at the start of a bar or on their own line, notations
> as `*name` straight after a chord, defined in the header with `*name: symbol label`.

The exact text is in `app/features/guide/prompt.js`.

---

## Notes for developers

- The reader is `app/features/chord-format/parse.js` (with `theory.js` for chords, keys and
  transposing). Keep this document and that code in step; `tests/parse.test.js` has a test
  for each rule here.
- The format's version is `FORMAT_VERSION` in `parse.js`. If a change would make an old file
  read differently, bump it and say so here.
- `.chords` files are UTF-8 text. Line endings, tabs, `♯` and `♭` are all accepted.
