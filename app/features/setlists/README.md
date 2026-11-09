# Set lists

The **Sets** tab (between Songs and Guide): set lists for gigs, newest changed first.

- **+** makes a new set (just a name) and opens it.
- **A set** (full screen): **▶ Play the set** opens the first chart with Previous and Next (and
  a "Next: title" button under each chart), through the `chart` service. Tap a song to start
  from it. **Add songs** ticks songs from the song list (search included; songs already in the
  set are shown ticked). ⌃ ⌄ move a song, ✕ takes it out. **Rename**, **Share as one file**,
  **Delete set** (its songs stay in the song list).
- **Add to a set** in a chart's ⋮ menu (`chart.tools`): pick a set, or make a new one.
- **Share as one file** makes `Set name.chords`: a first line `// Set: name`, then each song
  after a line of `---`. Importing that file in Songs adds the songs **and** makes the set again
  (from the `songs:imported` event), so the band can pass sets around.
- Songs deleted from the song list simply drop out of their sets.

**Saved data:** `sets` → `[{ id, name, songs: [song id], created, updated }]`. Never rename it.

**Service `setlists`:** `list()` → copies of the sets, `addTo(setId, songIds)`.

Requires `songs`; uses `chart-view` (without it a set can be made and ordered but not played).
Listens to `songs:changed` and `songs:imported`.
