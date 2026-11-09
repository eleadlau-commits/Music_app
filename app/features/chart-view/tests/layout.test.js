// layout.js is tested with a hand-made song (the shape chord-format gives) and a stand-in for
// the chords service, because a feature's tests may only use its own files.
import { test, assert } from 'folio/testing';
import { layout, lyricCells } from '../layout.js';

const chords = {
  displayChord: (chord, { semitones }) => (semitones ? `${chord.root}+${semitones}` : chord.root),
  transposeKey: (key, semitones) => ({ ...key, name: semitones ? `${key.name}+${semitones}` : key.name }),
};
const ev = (start, length, kind, root, marks = []) => ({ start, length, kind, symbol: root, chord: root ? { root } : null, marks });
const bar = (events, extra = {}) => ({ time: [4, 4], events, marks: [], changes: {}, ...extra });

const song = {
  title: 'T', artist: 'A', key: { root: 7, minor: false, name: 'G' }, tempo: 90, time: [4, 4], meta: {},
  marks: { stop: { symbol: '■', label: 'Band stops' } },
  sections: [{
    name: 'Verse', repeat: 1, reuses: null, lines: [
      { type: 'cue', text: 'Quiet' },
      {
        type: 'bars', repeat: 2,
        bars: [
          bar([ev(0, 0.5, 'chord', 'G'), ev(0.5, 0.5, 'chord', 'C')]),
          bar([ev(0, 0.5, 'chord', 'D', [{ name: 'stop' }]), ev(0.5, 0.5, 'hold', null)], { changes: { key: { root: 9, minor: false, name: 'A' } } }),
        ],
        lyrics: [[
          { bar: 0, onset: null, text: 'Oh ' },
          { bar: 0, onset: 0, text: 'hello ' },
          { bar: 0, onset: 1, text: 'there ' },
          { bar: 1, onset: 0, text: 'friend' },
        ]],
      },
    ],
  }],
};

test('facts, legend and items', () => {
  const m = layout(song, chords, {});
  assert.deepEqual(m.facts, ['Key G', '90 bpm', '4/4']);
  assert.deepEqual(m.legend.map((l) => l.name), ['stop']);
  assert.deepEqual(m.sections[0].items.map((i) => i.type), ['cue', 'lyrics']);
});

test('lyrics off shows bars instead', () => {
  const m = layout(song, chords, { lyrics: false });
  const bars = m.sections[0].items[1];
  assert.equal(bars.type, 'bars');
  assert.equal(bars.repeat, 2);
  assert.equal(bars.bars[0].changes.time, '4/4'); // the first bar shows the time signature
  assert.equal(bars.bars[1].changes.key, 'A');
});

test('chords over words, with words before the first chord on their own', () => {
  const m = layout(song, chords, {});
  const row = m.sections[0].items[1].rows[0];
  assert.deepEqual(row.map((c) => [c.chord, c.text, c.barStart]), [
    [null, 'Oh ', true], ['G', 'hello ', false], ['C', 'there ', false], ['D', 'friend', true],
  ]);
  assert.equal(row[3].marks[0].symbol, '■');
});

test('transposing passes through to the chords service', () => {
  const m = layout(song, chords, { semitones: 2 });
  assert.equal(m.facts[0], 'Key G+2 (written in G)');
  assert.equal(m.sections[0].items[1].rows[0][1].chord, 'G+2');
});

test('quick changes ask for more room, and bars on a line share it', () => {
  const busy = bar([ev(0, 0.125, 'chord', 'Cmaj7'), ev(0.125, 0.875, 'chord', 'G')]);
  const m = layout({ ...song, sections: [{ name: '', repeat: 1, lines: [{ type: 'bars', repeat: 1, bars: [busy], lyrics: [] }] }] }, chords, {});
  assert.ok(m.sections[0].items[0].bars[0].width > 4.5);
});

test('a bar with no chord change still shows', () => {
  const cells = lyricCells([], [{ events: [{ kind: 'hold', marks: [] }], marks: [] }]);
  assert.equal(cells.length, 1);
  assert.ok(cells[0].empty);
});
