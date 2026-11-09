# Chart

Shows a song full screen as a chart. Opened from the Songs tab (through the `chart` service).

- **Bars:** one row per line of bars in the file, wrapping when there isn't room. Each chord
  sits where its beat falls, with small dots for the beats. Busy bars get more room
  (`layout.js` works out how much). Time signature, key and tempo changes show over the bar
  they start on. A bar repeated with `%` is drawn fainter.
- **Lyrics:** lines with words show each chord over the word it lands on, with a thin line
  where each bar starts. **Bars** (the switch) shows every line as bars instead, for players
  who don't need the words.
- **Notations:** small tags over the chord (`■` Band stops, or the song's own), with a legend
  under the title.
- **Transpose** with − and +; tap the key to go back to the written key. **Chords / 1 4 5**
  switches between letter names and Nashville numbers (numbers need a `key:` in the file).
  Both are remembered for each song.
- **A− / A+** text size, for every song.
- **Scrolling by itself:** the round ▶ button at the bottom, with Slow, Medium or Fast next to it.
- **⋮:** tools from the `chart.tools` slot: Share or save the file (as `Title.chords`), Delete
  this song, and Edit (from `chart-editor`).
- **Things to check:** if the file has problems (a chord it can't read, a bar with an odd
  number of beats), a box at the top lists them with line numbers.
- The screen stays on while a chart is open, where the phone allows it.

**Saved data:** `songs` → `{ [song id]: { semitones, mode } }`, `view` → `{ size, lyrics, speed }`.

**Service `chart`:** `open(id)`, `render(text, { semitones, mode, lyrics })` → an element with
the chart drawn from `.chords` text (no toolbar).

**Slot `chart.tools`:** `{ id, label, icon, order, onClick(songId, chart) }`, rows in the ⋮
menu; `chart` has `close()` and `redraw()`.

Requires `songs` and `chord-format`.
