import { test, assert } from 'folio/testing';
import { parseFile, parseSong, tokenize } from '../parse.js';

const symbols = (bar) => bar.events.map((e) => e.symbol ?? e.kind);

test('reads the header', () => {
  const s = parseSong('title: Hey\nartist: Band\nkey: Bb\ntempo: 140\ntime: 6/8\n\n| Bb |');
  assert.equal(s.title, 'Hey');
  assert.equal(s.artist, 'Band');
  assert.equal(s.key.name, 'Bb');
  assert.equal(s.tempo, 140);
  assert.deepEqual(s.time, [6, 8]);
  assert.equal(s.problems.length, 0);
});

test('bars split evenly, and [ ] splits a beat', () => {
  const s = parseSong('| C . [G Am] F |');
  const bar = s.sections[0].lines[0].bars[0];
  assert.deepEqual(symbols(bar), ['C', 'hold', 'G', 'Am', 'F']);
  assert.deepEqual(bar.events.map((e) => e.start), [0, 0.25, 0.5, 0.625, 0.75]);
  assert.deepEqual(bar.onsets.map((e) => e.symbol), ['C', 'G', 'Am', 'F']);
});

test('groups nest for smaller parts', () => {
  const bar = parseSong('| [C [D E]] |').sections[0].lines[0].bars[0];
  assert.deepEqual(bar.events.map((e) => [e.symbol, e.start, e.length]), [['C', 0, 0.5], ['D', 0.5, 0.25], ['E', 0.75, 0.25]]);
});

test('one chord fills the bar, % repeats it, - is no chord', () => {
  const line = parseSong('| G | % | - . C . |').sections[0].lines[0];
  assert.deepEqual(line.bars.map(symbols), [['G'], ['G'], ['N.C.', 'hold', 'C', 'hold']]);
  assert.ok(line.bars[1].repeatsBar);
});

test('time signatures change from that bar on', () => {
  const s = parseSong('time: 4/4\n\n| C . . . | {3/4} G . . | D . . |\n{7/8}\n| A . . . . . . |');
  const bars = s.sections[0].lines.flatMap((l) => l.bars);
  assert.deepEqual(bars.map((b) => b.time.join('/')), ['4/4', '3/4', '3/4', '7/8']);
  assert.deepEqual(bars[1].changes.time, [3, 4]);
  assert.equal(s.problems.length, 0);
});

test('key and tempo changes', () => {
  const s = parseSong('key: C\n\n| C |\n{key: D}\n{tempo: 90}\n| 1 |');
  const bar = s.sections[0].lines[1].bars[0];
  assert.equal(bar.changes.key.name, 'D');
  assert.equal(bar.tempo, 90);
});

test('repeats: x2, |: :|, and sections', () => {
  const s = parseSong('[Verse x2]\n| C | G | x3\n|: Am | F :|\n\n[Chorus]\n| F |\n\n[Verse]');
  const [verse, , again] = s.sections;
  assert.equal(verse.repeat, 2);
  assert.equal(verse.lines[0].repeat, 3);
  assert.equal(verse.lines[1].repeat, 2);
  assert.equal(verse.lines[1].bars.length, 2);
  assert.equal(again.reuses, 'Verse');
  assert.equal(again.lines.length, 2);
});

test('notations: !, *name, *"text", and ones defined in the header', () => {
  const s = parseSong('*hit: ▲ Band hit\n\n| C! . G*hit . | D*"Drums out" *stop |');
  const [a, b] = s.sections[0].lines[0].bars;
  assert.deepEqual(a.events[0].marks, [{ name: 'accent' }]);
  assert.deepEqual(a.events[2].marks, [{ name: 'hit' }]);
  assert.deepEqual(b.events[0].marks, [{ text: 'Drums out' }]);
  assert.equal(b.events[1].kind, 'hold');
  assert.deepEqual(b.events[1].marks, [{ name: 'stop' }]);
  assert.deepEqual(s.marks.hit, { symbol: '▲', label: 'Band hit' });
  assert.equal(s.problems.length, 0);
});

test('notations every few bars or beats', () => {
  const s = parseSong('{every 2 bars *crash}\n| C | C | C |\n{every off}\n{every 2 beats *"clap"}\n| G . . . |');
  const bars = s.sections[0].lines.flatMap((l) => l.bars);
  assert.deepEqual(bars.map((b) => b.marks.length), [1, 0, 1, 2]);
  assert.deepEqual(bars[3].marks.map((m) => m.at), [0, 0.5]);
  assert.equal(s.problems[0].level, 'note'); // *crash isn't defined
});

test('lyrics: ^ marks where each chord lands, across bars', () => {
  const line = parseSong('| G . C . | D |\nI ^walked a^long the ^road').sections[0].lines[0];
  assert.deepEqual(line.lyrics[0], [
    { bar: 0, onset: null, text: 'I ' },
    { bar: 0, onset: 0, text: 'walked a' },
    { bar: 0, onset: 1, text: 'long the ' },
    { bar: 1, onset: 0, text: 'road' },
  ]);
});

test('lyrics: | in the words starts each bar', () => {
  const line = parseSong('| G | C . D . |\nHello | ^there my ^friend').sections[0].lines[0];
  assert.deepEqual(line.lyrics[0], [
    { bar: 0, onset: 0, text: 'Hello ' },
    { bar: 1, onset: 0, text: 'there my ' },
    { bar: 1, onset: 1, text: 'friend' },
  ]);
});

test('two lyric lines under one bar line are two passes', () => {
  const line = parseSong('| G | C | x2\n^First time\n^Second time').sections[0].lines[0];
  assert.equal(line.lyrics.length, 2);
});

test('cues, comments and words on their own', () => {
  const s = parseSong('[Intro]\n// not shown\n> Drums only\nJust some words');
  assert.deepEqual(s.sections[0].lines.map((l) => l.type), ['cue', 'text']);
});

test('several songs in one file', () => {
  const songs = parseFile('title: One\n\n| C |\n---\ntitle: Two\n\n| D |\n');
  assert.deepEqual(songs.map((s) => s.title), ['One', 'Two']);
  assert.equal(songs[1].source, 'title: Two\n\n| D |');
});

test('problems say which line and what to do', () => {
  const s = parseSong('title: X\n\n| C Hm . . |\n| [C D |');
  assert.equal(s.problems.length, 2);
  assert.equal(s.problems[0].line, 3);
  assert.match(s.problems[0].message, /Hm/);
  assert.equal(s.problems[1].line, 4);
  // A chord it can't read is still shown, as written.
  assert.equal(s.sections[0].lines[0].bars[0].events[1].symbol, 'Hm');
});

test('odd numbers of chords in a bar get a warning', () => {
  const s = parseSong('| C D E |');
  assert.equal(s.problems[0].level, 'warning');
});

test('numbers without a key get a warning', () => {
  assert.equal(parseSong('| 1 | 4 |').problems.length, 1);
  assert.equal(parseSong('key: A\n\n| 1 | 4 |').problems.length, 0);
});

test('tokens keep quoted text together', () => {
  assert.deepEqual(tokenize('C*"two words" [D E] {3/4}'), ['C*"two words"', '[', 'D', 'E', ']', '{3/4}']);
});
