# Chart editor

**Edit** in a chart's ⋮ menu (`chart.tools`). A text box with the song's `.chords` text and
two rows of quick keys: the format's symbols (`|`, `.`, `[ ]`, `^`, `-`, `%`, `*`, `{ }`,
`x2`, a new section) and chord letters (`C D E F G A B m 7 # b /`), so typing a chart on a
phone is quick. The keyboard stays open while you tap them.

As you type it reads the text and lists problems with their line numbers (tap one to jump
there), or says "Reads fine". **Preview** shows the chart (through `chart.render`, if the
`chart-view` feature is there). **Save** puts it back; if the text now holds several songs
(split by `---`), the first stays here and the rest become new songs. **Undo** goes
back to the saved song.

What you type is kept as a draft until Save, so closing the app doesn't lose it.

**Saved data:** `draft` → `{ id, text }`.

Requires `songs` and `chord-format`; uses `chart-view`. No services, slots or events of its own.
