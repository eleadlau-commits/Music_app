// Rules for set lists, without screen code (tests/sets.test.js).
// A set: { id, name, songs: [song id], created, updated }.

export function newSet(name, taken = new Set(), now = Date.now()) {
  let n = now;
  while (taken.has(`set${n.toString(36)}`)) n += 1;
  return { id: `set${n.toString(36)}`, name: tidyName(name), songs: [], created: now, updated: now };
}

export function tidyName(name) {
  const s = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return s || 'New set';
}

// Adds songs that aren't in the set yet, at the end. Returns a new set.
export function addSongs(set, ids, now = Date.now()) {
  const songs = [...set.songs];
  for (const id of ids) if (!songs.includes(id)) songs.push(id);
  return { ...set, songs, updated: now };
}

export function removeAt(set, index, now = Date.now()) {
  return { ...set, songs: set.songs.filter((_, i) => i !== index), updated: now };
}

// Swaps the song at `from` with the one `step` places away (-1 is up, +1 down). Out of range does nothing.
export function move(set, from, step, now = Date.now()) {
  const to = from + step;
  if (from < 0 || from >= set.songs.length || to < 0 || to >= set.songs.length) return set;
  const songs = [...set.songs];
  [songs[from], songs[to]] = [songs[to], songs[from]];
  return { ...set, songs, updated: now };
}

// The set's songs that still exist (a song may have been deleted since).
export function liveSongs(set, exists) {
  return set.songs.filter((id) => exists(id));
}

// The whole set as one .chords file: a "// Set: name" line, then the songs in order, each
// after a line of ---. Importing such a file in Songs makes the set again.
export function setFile(set, texts) {
  return [`// Set: ${set.name}`, ...texts.map((t) => `---\n${t}`)].join('\n');
}
