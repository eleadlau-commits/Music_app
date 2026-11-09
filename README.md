# Chords

Chord charts for the band, on your phone. Songs are plain-text **`.chords` files**: quick to
type, easy to read, and easy to ask Claude for. Import one (or paste what Claude wrote), and
the app draws it as a chart you can transpose and play from.

```
title: Harbour Lights
key: G
tempo: 92
*hit: ▲ Band hit

[Verse 1]
| G . . . | D/F# . . . | Em7 . . . | C . [D C] . |
The ^harbour lights are | ^fading out to | ^sea, and I'm | ^still ^here ^now

[Chorus]
| G . . . | D . . . | {3/4} Em . . | {4/4} D*hit . - . | x2
```

One thing per beat (`.` holds the chord), `[ ]` squeezes chords into one beat, `^` marks the
word each chord lands on, `{3/4}` changes the time signature, `*hit` adds a notation.
**The whole format is in [docs/FORMAT.md](docs/FORMAT.md).**

## Using the app

- **Songs** (opens first): your songs, with search. **+** adds songs: paste a chart, press
  **Paste**, or **Choose a file**. A file can hold a whole set (songs split by `---`).
- **Tap a song** to open its chart:
  - **− / +** transposes; tap the key to go back. **Chords / 1 4 5** switches to Nashville numbers.
  - **A− / A+** text size. **Lyrics / Bars**: chords over the words, or just the bars.
  - **▶** at the bottom scrolls by itself (Slow, Medium or Fast). The screen stays on.
  - **⋮**: **Edit** (with quick keys for `|` `.` `[ ]` `^` and chord letters, and problems
    shown as you type), **Share or save the file**, **Delete this song**.
  - If a file has mistakes, **Things to check** at the top lists them with line numbers.
    Nothing is ever refused: what can't be read is shown as written.
- **Sets**: set lists for gigs. **+** makes one; **Add songs** ticks songs from your list;
  ⌃ ⌄ put them in order. **▶ Play the set** opens each chart in turn with **Previous / Next**
  (and a **Next: title** button at the bottom). Add a song to a set from a chart's **⋮** too.
  **Share as one file** sends the whole set; importing that file makes the set again.
- **Guide**: get a chart from Claude. Type the song, **Copy the prompt**, paste it into Claude,
  then **Paste the answer**. Also the quick reference and an example.

Everything stays on your phone. Your transpose and display choices are remembered per song.

## Getting a chart from Claude

The Guide tab's **Copy the prompt** gives Claude the whole format with the song filled in.
Claude replies with a chart in a code block; copy it and use **Paste the answer**. Ask for
several songs at once ("…for: song A, song B, song C") and they come back split by `---`.
The prompt asks Claude to mark anything it's unsure of with `// check`, and to give only the
first few words of each lyric line (full lyrics are usually copyrighted); add the words you
need in **Edit**.

## Install it

GitHub builds the app every time something is merged into `main`:
- **Android:** the **Releases** page has `Chords.apk`. Open it on your phone and install.
- **Any phone (iPhone too):** the web version. Switch it on once in **Settings → Pages →
  Source: GitHub Actions**, then open `https://eleadlau-commits.github.io/Music_app/` and
  **Add to Home Screen**.

## For developers

Built with **Folio** (`folio/`, see `folio/README.md`): each feature is a folder in
`app/features/`, and `python build.py` assembles the app. `python build.py test` runs every
test, including the delete-a-folder test; `python build.py serve` runs it at
http://localhost:8000. See `CLAUDE.md` for the features and how to work on them.
