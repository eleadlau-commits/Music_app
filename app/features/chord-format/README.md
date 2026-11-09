# Chords format

Reads `.chords` files. Shows nothing itself; other features use its service.
The format is described for people (and for Claude) in `docs/FORMAT.md` at the top of the
repository. Change the two together.

- `parse.js`: text → songs (sections, bars, beats, lyrics, notations, problems with line numbers).
- `theory.js`: chord symbols, keys, transposing, letters ↔ Nashville numbers.

**Service `chords`:** `parseFile(text)` → songs (a file can hold several, split by `---`),
`parseSong(text)`, `tokenize(barText)`, `marks` (the built-in notations), `parseChord(symbol)`,
`parseKey(text)`, `displayChord(chord, { key, semitones, mode })` (`mode`: `'letters'`,
`'numbers'` or `'as-written'`), `transposeKey(key, semitones)`, `transposeSymbol(text, semitones, key)`,
`version` (the format's version, 1), `examples` (two made-up songs, `[{ id, text }]`, from `examples.js`).

No saved data, slots or events.
