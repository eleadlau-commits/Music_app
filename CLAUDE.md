# Chords (built with Folio)

**Chords** is a phone app for a cover band's chord charts. Songs are written in the
**Chords format** (`.chords` files), a plain-text format designed to be quick to type and easy
for Claude to write: bars and beats, beats split into smaller parts, lyrics with each chord
over its syllable, time and key changes, and notations (band hits, stops, the band's own) at
chosen beats or every few bars. The format is described in **`docs/FORMAT.md`**; read it
before changing the reader.

It's built with **Folio**, a small framework in `folio/` where every feature is a folder in
`app/features/` and a compiler (`python build.py`) assembles the app. **Read
`folio/README.md` before changing anything.** It explains slots, services, events,
feature.json, storage and the rules. This copy of Folio came from the timetable app (1.16.0);
1.17.0 lets the whole-app test start the app normally (see the README).

## Who you're working with

The owner describes what they want, and Claude builds it. So:
- **Explain in plain English** what changed and how to try it.
- **At the end, list exactly which files changed.**
- **Keep the band's songs safe.** Never rename a saved key. Bring old data across with `this.storage.once(...)`.

## How to work on it

1. **New feature?** Run `python build.py new-feature <id> --requires songs`, then fill it in. Don't grow an existing feature for something new.
2. **Stay in the feature's folder.** Change `folio/` only for something every app would need. If you do, update `folio/README.md` and bump `folio/VERSION` (and `VERSION` in `folio/runtime/folio.js`).
3. **Connect through slots, services and events, never by importing another feature's files** (tests too: the compiler rejects imports outside a feature's folder).
4. **Handle missing features.** `this.use()` can return null, and slots can be empty.
5. **Write tests** for rules in `tests/*.test.js`. Keep rules in small files without screen code.
6. **Run `python build.py test`** and fix everything before handing over. It includes the delete-a-folder test.
7. **Check it in a browser** with `python build.py serve`.
8. **Changing the format?** Change `docs/FORMAT.md`, `chord-format/parse.js` (and its tests), the example songs in `chord-format/examples.js` and the prompt in `guide/prompt.js` together. If old files would read differently, bump `FORMAT_VERSION` in `parse.js`.
9. **Update the docs:** the feature's `README.md`, the table below, and `README.md` for anything people see.

## Features

In start order. `python build.py list` shows the same, and `dist/report.html` maps every slot, service and event.

| Feature | What it does | Requires (uses) | Adds to | Offers |
|---|---|---|---|---|
| `chord-format` | Reads `.chords` text (`parse.js`); chord symbols, keys, transposing, letters ↔ Nashville numbers (`theory.js`); two made-up example songs (`examples.js`). Shows nothing | | | service `chords` |
| `songs` | The Songs tab (opens first): the list, search, Add songs (paste, Paste button, choose a file; several songs per file split by `---`); adds the examples on first open | chord-format | views | service `songs`; event `songs:changed` |
| `chart-view` | A song as a chart, full screen: bars by beat, chords over lyrics, notations and legend, time/key/tempo changes, problems with line numbers; transpose, Chords / 1 4 5, text size, Lyrics / Bars, scrolling by itself, screen kept on; Share or save the file, Delete | songs, chord-format | chart.tools | service `chart` (`open`, `render`); slot `chart.tools` |
| `chart-editor` | Edit in a chart's ⋮ menu: the text with quick keys, problems as you type, preview, draft kept until Save | songs, chord-format (chart-view) | chart.tools | |
| `guide` | The Guide tab: Copy the prompt for Claude (with the song filled in), Paste the answer, the quick reference, an example chart | (chart-view, songs) | views | |

**The screen:** Folio's frame: the top bar (menu on the left), the open tab's title, and two tabs along the bottom: **Songs · Guide**. Charts and the editor open full screen over them. Colours are in `app/theme.css` (warm paper in light mode, near-black in dark); chords use `--chord`, notations `--mark`, cues `--cue`, bar lines `--bar-line`, and charts use `--chart-mono` for chord names.

## Branches

Name each branch `claude/` plus a few words saying what the change is, e.g. `claude/setlists`. Never push straight to `main`.

## Releasing

- **On GitHub:** every push to `main` runs `.github/workflows/build.yml`. Tests run first, and if they fail nothing is released. Then the APK (`Chords.apk`) goes to Releases and the web version to GitHub Pages (switch Pages on once: Settings → Pages → Source: GitHub Actions).
- **The signing key:** `signing/debug.keystore` is made by the first build and committed by the workflow. **Never delete or replace it**, or new APKs won't install over old ones and people lose their songs.
- **The version** is in `app/app.json`. The app's `id` (`chords`) and `native.appId` (`io.github.chords.app`) must never change: the id is the start of every saved key.
