# Songs

The Songs tab (the one the app opens on): every song, searchable by title, artist or key,
with a line saying the key, tempo and time signature, and a red tag when some chords
couldn't be read.

**Add songs** (the + next to the title): paste a chart (what Claude wrote, or a `.chords`
file's text), press Paste, or Choose a file (`.chords`, `.txt`). It shows what it found
before adding. A file can hold several songs split by a line of `---`; each becomes its own
song. The first time the app opens it adds the two made-up examples from `chord-format`.

Tapping a song opens it with the `chart` service (from `chart-view`); without that feature,
the file is shown as text.

**Saved data:** `songs` → `[{ id, text, added, updated }]`, where `text` is the song's `.chords`
text. Never rename this key.

**Service `songs`:** `list()` → `[{ id, title, artist, key, line, problems, added, updated }]`
sorted by title, `get(id)` → the saved song, `parsed(id)` → the song read by `chord-format`
(worked out once per change), `add(text)` → new ids, `update(id, text)`, `remove(id)`,
`import()` (opens Add songs).

**Events:** `songs:changed` (`{ count }`) after any change; `songs:imported` (`{ ids, set }`)
after Add songs, where `set` is the name from a first line `// Set: name` (a file shared from
a set list), or null.

Requires `chord-format`.
