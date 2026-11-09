// Turns a song read by chord-format into what the chart shows: chord names in the chosen key
// and style, bars with their chords placed by beat, and lyric lines with each chord over its
// syllable. No screen code here (tests/layout.test.js); Chart.js draws the result.
//
// layout(song, chords, { semitones, mode, lyrics }) →
//   { title, artist, facts, key, legend, sections: [{ name, repeat, reuses, items }] }
//   items: { type: 'cue' | 'text', text }
//          { type: 'bars', repeat, bars }                 (a line of bars)
//          { type: 'lyrics', repeat, rows, bars }         (chords over words; one row per lyric line)
//   bars:  { width, events: [{ start, length, label, kind, marks }], marks, time, key, tempo, beats }
//   rows:  [{ chord, text, barStart, marks }]

// Roughly how wide a chord name is, in ems, so busy bars get more room.
const labelWidth = (label) => 0.63 * Math.max(1, String(label || '').length) + 0.2;
const MAX_WIDTH = 8.5; // ems: two bars still fit side by side on a phone

export function layout(song, chords, { semitones = 0, mode = 'as-written', lyrics = true } = {}) {
  let key = song.key;
  const used = new Map(); // mark name → definition, for the legend
  const markOut = (m) => {
    if (m.text != null) return { symbol: null, text: m.text, label: m.text };
    const def = song.marks[m.name] || { symbol: '•', label: m.name };
    used.set(m.name, def);
    return { symbol: def.symbol, text: null, label: def.label, name: m.name };
  };
  let firstBar = true;

  const bar = (b) => {
    const changes = {};
    if (b.changes.key) {
      key = b.changes.key;
      changes.key = chords.transposeKey(key, semitones).name;
    }
    if (b.changes.time || firstBar) changes.time = b.time.join('/');
    if (b.changes.tempo) changes.tempo = b.changes.tempo;
    firstBar = false;
    const events = b.events.map((e) => ({
      start: e.start,
      length: e.length,
      kind: e.kind,
      label: e.kind === 'chord' ? chords.displayChord(e.chord, { key, semitones, mode })
        : e.kind === 'rest' ? 'N.C.' : e.kind === 'text' ? e.symbol : '',
      marks: e.marks.map(markOut),
    }));
    // Room: enough that each chord name fits before the next one starts.
    let width = 4.5;
    const shown = events.filter((e) => e.label || e.marks.length);
    shown.forEach((e, k) => {
      e.room = (k + 1 < shown.length ? shown[k + 1].start : 1) - e.start;
      width = Math.max(width, labelWidth(e.label || 'x') / e.room);
    });
    return {
      events, changes, beats: b.time[0], time: b.time.join('/'), repeatsBar: Boolean(b.repeatsBar),
      marks: b.marks.map((m) => ({ at: m.at, ...markOut(m) })),
      width,
    };
  };

  const sections = song.sections.map((s) => {
    const items = [];
    for (const line of s.lines) {
      if (line.type !== 'bars') {
        items.push({ type: line.type, text: line.text });
        continue;
      }
      const bars = line.bars.map(bar);
      // Bars on one line share the same width, so beats line up from bar to bar. Very quick
      // changes don't get all the room they'd like: their names are drawn smaller ("tight"),
      // and the one after a tight name is raised so they don't overlap.
      const widest = Math.min(MAX_WIDTH, Math.max(...bars.map((b) => b.width)));
      for (const b of bars) {
        b.width = widest;
        let prevTight = false;
        for (const e of b.events) {
          if (!e.label && !e.marks.length) continue;
          e.raised = prevTight;
          e.tight = (labelWidth(e.label || 'x') + 0.3) / e.room > widest;
          // a name that would run past the end of the bar is lined up with its right edge
          e.atEnd = e.start > 0 && e.start + (labelWidth(e.label || 'x') * (e.tight ? 0.8 : 1)) / widest > 1.02;
          prevTight = e.tight && !e.raised;
          delete e.room;
        }
      }
      if (lyrics && line.lyrics.length) items.push({ type: 'lyrics', repeat: line.repeat, bars, rows: line.lyrics.map((row) => lyricCells(row, bars)) });
      else items.push({ type: 'bars', repeat: line.repeat, bars });
    }
    return { name: s.name, repeat: s.repeat, reuses: s.reuses, items };
  });

  const shownKey = song.key ? chords.transposeKey(song.key, semitones) : null;
  const facts = [];
  if (shownKey) facts.push(semitones ? `Key ${shownKey.name} (written in ${song.key.name})` : `Key ${shownKey.name}`);
  if (song.tempo) facts.push(`${song.tempo} bpm`);
  facts.push(song.time.join('/'));
  if (song.meta.capo) facts.push(`Capo ${song.meta.capo}`);
  return {
    title: song.title, artist: song.artist, facts, key: shownKey,
    legend: [...used.entries()].map(([name, def]) => ({ name, ...def })),
    notes: song.meta.notes || '',
    sections,
  };
}

// One lyric line → cells, each a chord with the words sung from it. Words before a bar's first
// chord get a cell with no chord. Bars with no chord change still show as a bar line.
export function lyricCells(segments, bars) {
  const cells = [];
  bars.forEach((b, bi) => {
    const onsets = b.events.filter((e) => e.kind !== 'hold');
    const here = segments.filter((s) => s.bar === bi);
    let first = true;
    const push = (cell) => {
      // notations that fall at the start of the bar ({every …}) go on its first cell
      const barMarks = first ? b.marks.filter((m) => m.at === 0) : [];
      cells.push({ ...cell, marks: [...barMarks, ...cell.marks], barStart: first });
      first = false;
    };
    const pickup = here.filter((s) => s.onset == null).map((s) => s.text).join('');
    if (pickup) push({ chord: null, text: pickup, marks: [] });
    onsets.forEach((e, k) => {
      const text = here.filter((s) => s.onset === k).map((s) => s.text).join('');
      push({ chord: e.label, text, marks: e.marks });
    });
    // marks on held beats (e.g. ". *stop") still show, on a cell of their own
    const heldMarks = b.events.filter((e) => e.kind === 'hold' && e.marks.length).flatMap((e) => e.marks);
    if (heldMarks.length) push({ chord: null, text: '', marks: heldMarks });
    if (first) push({ chord: null, text: '', marks: [], empty: true });
  });
  return cells;
}
