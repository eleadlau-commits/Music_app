import { test, assert } from 'folio/testing';
import { newId, summary, titleOf, matches, byTitle } from '../library.js';

test('ids never clash', () => {
  const a = newId(new Set(), 1000);
  const b = newId(new Set([a]), 1000);
  assert.ok(a !== b);
});

test('summary line', () => {
  assert.equal(summary({ key: { name: 'G' }, tempo: 92, time: [4, 4] }), 'G · 92 bpm · 4/4');
  assert.equal(summary({ key: null, tempo: null, time: [6, 8] }), '6/8');
});

test('titles fall back to the first words', () => {
  assert.equal(titleOf({ title: 'Hey' }), 'Hey');
  assert.equal(titleOf({ title: '' }, '// note\n| C | G |'), '| C | G |');
  assert.equal(titleOf(null, ''), 'Untitled song');
});

test('search and sort', () => {
  assert.ok(matches({ title: 'Harbour Lights', artist: 'Band' }, 'harb'));
  assert.ok(matches({ title: 'X', artist: 'The Band' }, 'band'));
  assert.ok(!matches({ title: 'X', artist: 'Y' }, 'z'));
  const sorted = [{ title: 'The Zoo' }, { title: 'apple' }, { title: 'Mango' }].sort(byTitle);
  assert.deepEqual(sorted.map((s) => s.title), ['apple', 'Mango', 'The Zoo']);
});
