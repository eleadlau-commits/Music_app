// Rules for the song list, without screen code (tests/library.test.js).

// A new id that won't clash with the ones already used.
export function newId(taken = new Set(), now = Date.now()) {
  let n = now;
  while (taken.has(`s${n.toString(36)}`)) n += 1;
  return `s${n.toString(36)}`;
}

// A song's one-line summary from its parsed form: "G · 92 bpm · 4/4".
export function summary(parsed) {
  if (!parsed) return '';
  return [parsed.key?.name, parsed.tempo && `${parsed.tempo} bpm`, parsed.time && parsed.time.join('/')]
    .filter(Boolean).join(' · ');
}

// The name to show: the title, or the first words of the file.
export function titleOf(parsed, text = '') {
  if (parsed?.title) return parsed.title;
  const first = String(text).split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('//'));
  return first ? first.slice(0, 40) : 'Untitled song';
}

// Whether a song matches what was typed in the search box (title, artist or key).
export function matches(entry, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return [entry.title, entry.artist, entry.key].some((v) => v && v.toLowerCase().includes(q));
}

// Sorts by title, ignoring "The" and capitals.
export function byTitle(a, b) {
  const key = (s) => String(s.title || '').toLowerCase().replace(/^the\s+/, '');
  return key(a).localeCompare(key(b));
}
