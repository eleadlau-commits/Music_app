import { test, assert } from 'folio/testing';
import { parseChord, parseKey, displayChord, transposeKey, transposeSymbol, noteValue, degreeValue } from '../theory.js';

test('reads chord symbols', () => {
  assert.deepEqual(parseChord('F#m7b5/C#'), { root: 'F#', quality: 'm7b5', bass: 'C#', numeric: false });
  assert.deepEqual(parseChord('b7sus4'), { root: 'b7', quality: 'sus4', bass: null, numeric: true });
  assert.deepEqual(parseChord('C6/9'), { root: 'C', quality: '6/9', bass: null, numeric: false });
  assert.deepEqual(parseChord('5/7'), { root: '5', quality: '', bass: '7', numeric: true });
  assert.equal(parseChord('Bb').root, 'Bb');
  assert.equal(parseChord('Cmaj7').quality, 'maj7');
  assert.equal(parseChord('Hello'), null);
  assert.equal(parseChord('Go'), null);
  assert.equal(parseChord('8'), null);
});

test('reads keys', () => {
  assert.deepEqual(parseKey('Em'), { root: 4, minor: true, name: 'Em' });
  assert.deepEqual(parseKey('bb'), { root: 10, minor: false, name: 'Bb' });
  assert.equal(parseKey('F# minor').name, 'F#m');
  assert.equal(parseKey('H'), null);
});

test('notes and numbers', () => {
  assert.equal(noteValue('C'), 0);
  assert.equal(noteValue('Cb'), 11);
  assert.equal(degreeValue('b7'), 10);
  assert.equal(degreeValue('#4'), 6);
});

test('transposes letters with the spelling of the new key', () => {
  assert.equal(transposeSymbol('G', 2, 'G'), 'A');
  assert.equal(transposeSymbol('D/F#', 3, 'G'), 'F/A');
  assert.equal(transposeSymbol('Em7', 3, 'G'), 'Gm7');
  assert.equal(transposeSymbol('C', 1, 'C'), 'Db'); // the key of Db is written with flats
  assert.equal(transposeSymbol('C', 3, 'C'), 'Eb'); // Eb major is a flat key
  assert.equal(transposeSymbol('Bb', 0, 'G'), 'Bb'); // not moving: as written
  assert.equal(transposeKey(parseKey('G'), 3).name, 'Bb');
  assert.equal(transposeKey(parseKey('Em'), 1).name, 'Fm');
});

test('turns numbers into letters and back', () => {
  const key = parseKey('G');
  assert.equal(displayChord(parseChord('6m7'), { key, mode: 'letters' }), 'Em7');
  assert.equal(displayChord(parseChord('5/7'), { key, mode: 'letters' }), 'D/F#');
  assert.equal(displayChord(parseChord('b7'), { key, mode: 'letters' }), 'F');
  assert.equal(displayChord(parseChord('6-7'), { key, mode: 'letters' }), 'Em7');
  assert.equal(displayChord(parseChord('1'), { key, mode: 'letters', semitones: 2 }), 'A');
  assert.equal(displayChord(parseChord('D/F#'), { key, mode: 'numbers' }), '5/7');
  assert.equal(displayChord(parseChord('Bbmaj7'), { key, mode: 'numbers' }), 'b3maj7');
  assert.equal(displayChord(parseChord('4'), { key: null, mode: 'letters' }), '4'); // no key: as written
});
