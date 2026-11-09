// The quick keys above the text box, and inserting their text where the cursor is.
// No screen code (tests/keys.test.js).

// Each key: what it shows, what it types, and where the cursor ends up (offset from the
// start of the inserted text; default: after it).
export const QUICK_KEYS = [
  { label: '|', text: ' | ' },
  { label: '·', text: '. ', title: 'Hold for a beat' },
  { label: '[ ]', text: '[ ]', cursor: 1, title: 'Split a beat' },
  { label: '^', text: '^', title: 'Chord lands on this word' },
  { label: '-', text: '- ', title: 'No chord' },
  { label: '%', text: '% ', title: 'Repeat the bar' },
  { label: '*', text: '*', title: 'Notation' },
  { label: '{ }', text: '{}', cursor: 1, title: 'Time, key or tempo change' },
  { label: 'x2', text: ' x2' },
  { label: '[§]', text: '\n[]\n', cursor: 2, title: 'New section' },
];

export const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'm', '7', '#', 'b', '/'];

// Inserts text into value at [start, end) → { value, cursor }.
export function insertAt(value, start, end, key) {
  const text = typeof key === 'string' ? key : key.text;
  const cursorOffset = typeof key === 'string' || key.cursor == null ? text.length : key.cursor;
  return { value: value.slice(0, start) + text + value.slice(end), cursor: start + cursorOffset };
}
