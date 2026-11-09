import { test, assert } from 'folio/testing';
import { newSet, tidyName, addSongs, removeAt, move, liveSongs, setFile } from '../sets.js';

test('new sets get a tidy name and an id that is free', () => {
  const a = newSet('  Friday   gig ', new Set(), 1000);
  assert.equal(a.name, 'Friday gig');
  assert.ok(newSet('x', new Set([a.id]), 1000).id !== a.id);
  assert.equal(tidyName(''), 'New set');
});

test('adding skips songs already in the set', () => {
  const s = addSongs(addSongs(newSet('A'), ['s1', 's2']), ['s2', 's3']);
  assert.deepEqual(s.songs, ['s1', 's2', 's3']);
});

test('moving and removing', () => {
  const s = addSongs(newSet('A'), ['a', 'b', 'c']);
  assert.deepEqual(move(s, 2, -1).songs, ['a', 'c', 'b']);
  assert.deepEqual(move(s, 0, -1).songs, ['a', 'b', 'c']);
  assert.deepEqual(removeAt(s, 1).songs, ['a', 'c']);
});

test('deleted songs drop out', () => {
  const s = addSongs(newSet('A'), ['a', 'gone', 'c']);
  assert.deepEqual(liveSongs(s, (id) => id !== 'gone'), ['a', 'c']);
});

test('a set as one file', () => {
  assert.equal(setFile({ name: 'Gig' }, ['title: A', 'title: B']), '// Set: Gig\n---\ntitle: A\n---\ntitle: B');
});
