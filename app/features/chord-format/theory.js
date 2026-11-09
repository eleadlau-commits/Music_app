// Music rules for the Chords format: reading a chord symbol, moving it to another key, and
// switching between letter names (G, Em7, D/F#) and Nashville numbers (1, 6m7, 5/7).
// No screen code here, so it's easy to test (tests/theory.test.js).

const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]; // degrees 1–7 of a major scale, in semitones
const DEGREE_NAMES = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];

// Keys spelled with flats. Everything else is spelled with sharps.
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm']);

const NOTE = '[A-G](?:#|b)?';
const NUMBER = '[b#]?[1-7]';
const ROOT_RE = new RegExp(`^(${NOTE}|${NUMBER})`);
const NOTE_RE = new RegExp(`^${NOTE}$`);
const NUMBER_RE = new RegExp(`^${NUMBER}$`);

const mod12 = (n) => ((n % 12) + 12) % 12;

// A note name (C, F#, Bb) → 0–11, or null.
export function noteValue(name) {
  if (!name || !NOTE_RE.test(name)) return null;
  let v = LETTERS[name[0]];
  if (name[1] === '#') v += 1;
  if (name[1] === 'b') v -= 1;
  return mod12(v);
}

// A Nashville number (1, b7, #4) → semitones above the key's root, or null.
export function degreeValue(num) {
  if (!num || !NUMBER_RE.test(num)) return null;
  let v = MAJOR_STEPS[Number(num[num.length - 1]) - 1];
  if (num[0] === 'b') v -= 1;
  if (num[0] === '#') v += 1;
  return mod12(v);
}

// Reads a key such as "G", "Em", "Bb", "F#m" or "C minor" → { root, minor, name } or null.
export function parseKey(text) {
  if (!text) return null;
  const m = String(text).trim().match(/^([A-G](?:#|b)?)\s*(m|min|minor|-)?(?:\s*(?:maj|major))?$/i);
  if (!m) return null;
  const letter = m[1][0].toUpperCase() + m[1].slice(1);
  const root = noteValue(letter);
  if (root == null) return null;
  const minor = Boolean(m[2]);
  return { root, minor, name: letter + (minor ? 'm' : '') };
}

// Whether a key is written with flats.
export function prefersFlats(key) {
  return key ? FLAT_KEYS.has(key.name) : false;
}

// The name of a note value in a key: sharps or flats as that key spells them.
export function noteName(value, key, flats) {
  const useFlats = flats ?? prefersFlats(key);
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[mod12(value)];
}

// Moves a key up or down by semitones, keeping major or minor.
export function transposeKey(key, semitones) {
  if (!key) return null;
  const root = mod12(key.root + semitones);
  // Pick the spelling a musician would: Bb rather than A#, F# rather than Gb for major keys.
  const majorish = key.minor ? mod12(root + 3) : root;
  const flats = [5, 10, 3, 8, 1].includes(majorish); // F, Bb, Eb, Ab, Db (and their relative minors)
  const name = (flats ? FLAT_NAMES : SHARP_NAMES)[root] + (key.minor ? 'm' : '');
  return { root, minor: key.minor, name };
}

// Splits a chord symbol into its parts, or returns null if it isn't a chord.
//   "F#m7b5/C#" → { root: 'F#', quality: 'm7b5', bass: 'C#', numeric: false }
//   "b7sus4"     → { root: 'b7', quality: 'sus4', bass: null, numeric: true }
//   "C6/9"       → { root: 'C', quality: '6/9', bass: null } (9 isn't a bass note)
export function parseChord(symbol) {
  if (!symbol) return null;
  const m = symbol.match(ROOT_RE);
  if (!m) return null;
  const root = m[1];
  let rest = symbol.slice(root.length);
  let bass = null;
  const slash = rest.lastIndexOf('/');
  if (slash >= 0) {
    const tail = rest.slice(slash + 1);
    if (NOTE_RE.test(tail) || NUMBER_RE.test(tail)) {
      bass = tail;
      rest = rest.slice(0, slash);
    }
  }
  if (/[\s[\]{}|]/.test(rest)) return null;
  // Qualities are free-form (m7, maj9, sus4, 7#9, add9, dim, ø, +, -7…), but must not start
  // with a letter that would make the whole thing look like a word (e.g. "Go", "Day").
  if (rest && !/^(?:m|M|dim|aug|sus|add|alt|no|[0-9+°ø△Δ^\-#b(])/.test(rest)) return null;
  const numeric = NUMBER_RE.test(root);
  return { root, quality: rest, bass, numeric };
}

// Semitones of a root (letter or number) above C, given the key for numbers.
function rootValue(part, key) {
  const n = noteValue(part);
  if (n != null) return n;
  const d = degreeValue(part);
  if (d != null && key) return mod12(key.root + d);
  return null;
}

// Writes a chord for display.
//   chord: from parseChord
//   opts.key: the song's key (from parseKey), needed for numbers
//   opts.semitones: how far to transpose (letters only; numbers don't move)
//   opts.mode: 'letters' | 'numbers' | 'as-written'
// Returns the text to show. Anything that can't be converted is shown as written.
export function displayChord(chord, { key = null, semitones = 0, mode = 'as-written' } = {}) {
  if (!chord) return '';
  const targetKey = key ? transposeKey(key, semitones) : null;
  const want = mode === 'as-written' ? (chord.numeric ? 'numbers' : 'letters') : mode;
  const part = (p) => {
    if (want === 'numbers') {
      if (NUMBER_RE.test(p)) return p;
      if (!key) return p; // no key: can't work out the number
      return DEGREE_NAMES[mod12(noteValue(p) - key.root)];
    }
    // letters
    if (semitones === 0 && NOTE_RE.test(p)) return p; // not moving: keep it as written
    const v = rootValue(p, key);
    if (v == null) return p;
    // Without a key, keep the chord's own style (flats stay flats).
    return noteName(v + semitones, targetKey, targetKey ? undefined : p.includes('b'));
  };
  let quality = chord.quality;
  // Nashville writes minor as "-" sometimes; show letters with "m".
  if (want === 'letters' && chord.numeric && quality.startsWith('-')) quality = 'm' + quality.slice(1);
  return part(chord.root) + quality + (chord.bass ? '/' + part(chord.bass) : '');
}

// Shorthand: transpose a chord symbol written as text. Returns the text unchanged if it isn't a chord.
export function transposeSymbol(symbol, semitones, key = null) {
  const chord = parseChord(symbol);
  if (!chord) return symbol;
  return displayChord(chord, { key: key ? parseKey(key) : null, semitones, mode: 'letters' });
}
