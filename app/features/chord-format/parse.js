// Reads the Chords format (.chords files) into songs. The format is described in
// docs/FORMAT.md; keep the two in step. No screen code here (tests in tests/parse.test.js).
//
// A song comes back as:
//   { title, artist, meta, key, time, tempo, marks, sections, problems, source }
//   sections: [{ name, repeat, reuses, lines }]
//   lines:    { type: 'bars', bars, repeat, lyrics, line }
//             { type: 'cue', text, line }      (a "> note" line)
//             { type: 'text', text, line }     (words with no bars above them)
//   bars:     { time: [beats, unit], slots, events, onsets, changes, marks, line }
//   events:   every chord, hold or rest in the bar, flattened, with start and length as
//             parts of the bar (0–1): { start, length, kind, symbol, chord, marks }
//   lyrics:   one list per lyric line: [{ bar, onset, text }] (onset = which chord in that
//             bar the words start on, or null for words sung before the bar's first chord)

import { parseChord, parseKey } from './theory.js';

export const FORMAT_VERSION = 1;

// Notations everyone can use without defining them first. A song can add its own in its
// header (`*hit: ▲ Band hit`) or change these.
export const BUILT_IN_MARKS = {
  accent: { symbol: '>', label: 'Accent (hit it)' },
  stop: { symbol: '■', label: 'Band stops' },
  push: { symbol: '‹', label: 'Push (play it a little early)' },
  hold: { symbol: '⌒', label: 'Hold (let it ring)' },
  fill: { symbol: '~', label: 'Fill' },
  solo: { symbol: '★', label: 'Solo' },
  drums: { symbol: '◆', label: 'Drums' },
  build: { symbol: '↗', label: 'Build up' },
  quiet: { symbol: 'p', label: 'Play quietly' },
  loud: { symbol: 'f', label: 'Play loud' },
};

const HEADER_RE = /^([A-Za-z][A-Za-z0-9 _-]{0,30}):\s*(.*)$/;
const MARK_DEF_RE = /^\*([A-Za-z][\w-]*)\s*[:=]\s*(.*)$/;
const SECTION_RE = /^\[([^\]]+)\]\s*(?:\/\/.*)?$/;
const REPEAT_RE = /^(?:x|×)\s*(\d{1,2})$/i;
const TIME_RE = /^(\d{1,2})\s*\/\s*(1|2|4|8|16|32)$/;
const SONG_BREAK_RE = /^-{3,}\s*$/;

// Reads a whole file, which may hold several songs separated by a line of three dashes.
export function parseFile(text) {
  const lines = normalise(text).split('\n');
  const chunks = [];
  let start = 0;
  lines.forEach((line, i) => {
    if (SONG_BREAK_RE.test(line.trim())) {
      chunks.push([start, i]);
      start = i + 1;
    }
  });
  chunks.push([start, lines.length]);
  return chunks
    .map(([from, to]) => ({ from, body: lines.slice(from, to) }))
    .filter((c) => c.body.some((l) => l.trim() && !l.trim().startsWith('//')))
    .map((c) => parseLines(c.body, c.from));
}

// Reads one song.
export function parseSong(text) {
  return parseLines(normalise(text).split('\n'), 0);
}

function normalise(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b');
}

function parseLines(lines, offset) {
  const song = {
    title: '', artist: '', meta: {}, key: null, time: [4, 4], tempo: null,
    marks: { ...BUILT_IN_MARKS }, sections: [], problems: [],
    source: lines.join('\n').replace(/^\n+|\n+$/g, ''),
  };
  const st = {
    song, offset, inHeader: true, section: null, lastBars: null, lastBar: null,
    time: [4, 4], key: null, tempo: null, pending: {}, every: [], warnedNumbers: false,
    usedMarks: new Set(),
  };
  const problem = (lineNo, level, message) => song.problems.push({ line: lineNo + offset + 1, level, message });
  st.problem = problem;

  lines.forEach((raw, i) => {
    const text = raw.trim();
    if (!text || text.startsWith('//')) {
      if (!text) st.lastBars = null; // a blank line ends the lyrics for the bars above
      return;
    }
    const markDef = text.match(MARK_DEF_RE);
    if (markDef) return defineMark(st, markDef[1], markDef[2]);

    if (st.inHeader) {
      const h = text.match(HEADER_RE);
      if (h && !text.startsWith('[') && !text.startsWith('|')) {
        song.meta[h[1].trim().toLowerCase()] = h[2].trim();
        return;
      }
      endHeader(st, i);
    }

    const sec = text.match(SECTION_RE);
    if (sec) return startSection(st, sec[1].trim());

    ensureSection(st);
    if (text.startsWith('{')) {
      const body = stripComment(text);
      if (!body.endsWith('}')) return problem(i, 'error', `A { … } instruction isn't closed: ${text}`);
      return directive(st, body.slice(1, -1), i);
    }
    if (text.startsWith('>')) {
      st.section.lines.push({ type: 'cue', text: text.slice(1).trim(), line: i + offset + 1 });
      return;
    }
    if (text.startsWith('|')) return barsLine(st, stripComment(text), i);

    // Words: lyrics for the bars just above, or a line of words on its own.
    if (st.lastBars) st.lastBars.lyrics.push(lyricRow(st, raw.replace(/\s+$/, ''), st.lastBars, i));
    else st.section.lines.push({ type: 'text', text: raw.trim().replace(/\^/g, ''), line: i + offset + 1 });
  });
  if (st.inHeader) endHeader(st, lines.length);
  finishSections(st);
  for (const name of st.usedMarks) {
    if (!song.marks[name]) {
      song.marks[name] = { symbol: '•', label: name };
      song.problems.push({ line: null, level: 'note', message: `*${name} isn't defined, so it shows as "${name}". Add "*${name}: label" to the header to describe it.` });
    }
  }
  return song;
}

function stripComment(text) {
  return text.replace(/\s+\/\/.*$/, '').trim();
}

function defineMark(st, name, rest) {
  let label = rest.trim();
  let symbol = null;
  const m = label.match(/^(\S)\s+(.+)$/);
  if (m && !/[A-Za-z0-9]/.test(m[1])) [symbol, label] = [m[1], m[2]];
  st.song.marks[name] = { symbol: symbol || name.slice(0, 1).toUpperCase(), label: label || name };
}

function endHeader(st, i) {
  st.inHeader = false;
  const { song } = st;
  const m = song.meta;
  song.title = m.title || m.song || '';
  song.artist = m.artist || m.by || m.band || '';
  if (m.key) {
    song.key = parseKey(m.key);
    if (!song.key) st.problem(i - 1, 'warning', `"${m.key}" isn't a key I know (try G, Em, Bb or F#m).`);
  }
  const t = (m.time || m.meter || '').match(TIME_RE);
  if (t) song.time = [Number(t[1]), Number(t[2])];
  else if (m.time) st.problem(i - 1, 'warning', `"${m.time}" isn't a time signature (try 4/4, 3/4 or 6/8).`);
  const bpm = parseInt(m.tempo || m.bpm, 10);
  if (bpm > 0) song.tempo = bpm;
  st.time = song.time;
  st.key = song.key;
  st.tempo = song.tempo;
}

function startSection(st, label) {
  let name = label;
  let repeat = 1;
  const m = label.match(/^(.*?)\s+(?:x|×)\s*(\d{1,2})$/i);
  if (m) [name, repeat] = [m[1].trim(), Number(m[2])];
  st.section = { name, repeat, reuses: null, lines: [] };
  st.song.sections.push(st.section);
  st.lastBars = null;
  st.lastBar = null;
  st.every = [];
}

function ensureSection(st) {
  if (!st.section) startSection(st, '');
}

// Empty sections that share a name with an earlier one play that one again, e.g. a second
// [Chorus] with nothing under it.
function finishSections(st) {
  const sections = st.song.sections;
  sections.forEach((s, i) => {
    if (s.lines.length) return;
    const earlier = sections.slice(0, i).reverse().find((e) => e.lines.length && e.name.toLowerCase() === s.name.toLowerCase());
    if (earlier) {
      s.reuses = earlier.name;
      s.lines = earlier.lines;
    }
  });
}

// { … } on a line of its own, or at the start of a bar.
function directive(st, body, i) {
  const text = body.trim();
  const t = text.replace(/^time\s*[:=]?\s*/i, '').match(TIME_RE);
  if (t) {
    st.time = [Number(t[1]), Number(t[2])];
    st.pending.time = st.time;
    return;
  }
  const k = text.match(/^key\s*[:=]?\s*(.+)$/i);
  if (k) {
    const key = parseKey(k[1]);
    if (!key) return st.problem(i, 'warning', `"${k[1]}" isn't a key I know.`);
    st.key = key;
    st.pending.key = key;
    return;
  }
  const bpm = text.match(/^(?:tempo\s*[:=]?\s*(\d{2,3})|(\d{2,3})\s*bpm)$/i);
  if (bpm) {
    st.tempo = Number(bpm[1] || bpm[2]);
    st.pending.tempo = st.tempo;
    return;
  }
  const every = text.match(/^every\s+(.*)$/i);
  if (every) return everyRule(st, every[1].trim(), i);
  st.problem(i, 'warning', `I don't know the instruction {${text}}. Try {3/4}, {key: A}, {tempo: 120} or {every 4 bars *crash}.`);
}

// {every 4 bars *crash}, {every 2 beats *"clap"}, {every off}, {every off *crash}
function everyRule(st, text, i) {
  const off = text.match(/^off(?:\s+(.+))?$/i);
  if (off) {
    if (!off[1]) st.every = [];
    else {
      const m = readMarks(off[1].trim(), st, i)[0];
      st.every = st.every.filter((r) => !m || r.mark.name !== m.name || r.mark.text !== m.text);
    }
    return;
  }
  const m = text.match(/^(\d{1,3})?\s*(bars?|beats?)\s+(.+)$/i);
  if (!m) return st.problem(i, 'warning', `{every ${text}} should look like {every 4 bars *crash} or {every 2 beats *clap}.`);
  const marks = readMarks(m[3].trim(), st, i);
  if (!marks.length) return st.problem(i, 'warning', `{every ${text}} needs a notation such as *crash or *"text".`);
  const n = Math.max(1, Number(m[1] || 1));
  const unit = m[2].toLowerCase().startsWith('bar') ? 'bar' : 'beat';
  for (const mark of marks) st.every.push({ n, unit, mark, count: 0 });
}

function applyEvery(st, bar) {
  const beats = bar.time[0];
  for (const rule of st.every) {
    if (rule.unit === 'bar') {
      if (rule.count % rule.n === 0) bar.marks.push({ at: 0, ...rule.mark });
      rule.count += 1;
    } else {
      for (let b = 0; b < beats; b += 1) {
        if ((rule.count + b) % rule.n === 0) bar.marks.push({ at: b / beats, ...rule.mark });
      }
      rule.count += beats;
    }
  }
}

// A line of bars: | G . . . | C . D . | x2
function barsLine(st, text, i) {
  let body = text;
  let repeat = 1;
  // |: … :| is a repeat; "x3" after the last bar line says how many times.
  const times = body.match(/(?:\|\s*|:\|\s*)(?:x|×)\s*(\d{1,2})\s*$/i);
  if (times) {
    repeat = Number(times[1]);
    body = body.slice(0, times.index) + (times[0].startsWith(':') ? ':|' : '|');
  }
  if (/^\|:/.test(body) || /:\|\s*$/.test(body)) {
    if (repeat === 1) repeat = 2;
    body = body.replace(/^\|:/, '|').replace(/:\|\s*$/, '|');
  }
  body = body.replace(/\|\|/g, '|');
  const parts = body.split('|').slice(1);
  if (parts.length && !parts[parts.length - 1].trim()) parts.pop(); // after the closing bar line
  const line = { type: 'bars', bars: [], repeat, lyrics: [], line: i + st.offset + 1 };
  for (const part of parts) {
    const bar = readBar(st, part, i);
    if (bar) line.bars.push(bar);
  }
  if (!line.bars.length) return st.problem(i, 'warning', 'This bar line has no bars in it.');
  st.section.lines.push(line);
  st.lastBars = line;
}

function readBar(st, text, i) {
  let tokens;
  try {
    tokens = tokenize(text);
  } catch (e) {
    st.problem(i, 'error', e.message);
    tokens = [];
  }
  // Instructions at the start of a bar: | {3/4} G . . |
  while (tokens.length && tokens[0].startsWith('{')) {
    const t = tokens.shift();
    if (!t.endsWith('}')) st.problem(i, 'error', `A { … } instruction isn't closed: ${t}`);
    else directive(st, t.slice(1, -1), i);
  }
  const changes = st.pending;
  st.pending = {};
  const bar = { time: st.time, key: st.key, tempo: st.tempo, slots: [], events: [], onsets: [], changes, marks: [], line: i + st.offset + 1 };

  if (tokens.length === 1 && tokens[0] === '%') {
    if (!st.lastBar) st.problem(i, 'error', '% repeats the bar before it, but there isn\'t one.');
    else bar.slots = st.lastBar.slots;
    bar.repeatsBar = true;
  } else {
    if (tokens.includes('%')) st.problem(i, 'error', '% must be on its own in a bar (it repeats the whole bar before).');
    try {
      bar.slots = buildSlots(tokens.filter((t) => t !== '%'), st, i);
    } catch (e) {
      st.problem(i, 'error', e.message);
      bar.slots = [];
    }
  }
  if (!bar.slots.length) bar.slots = [{ kind: 'hold', marks: [] }];

  const n = bar.slots.length;
  const beats = bar.time[0];
  if (!bar.repeatsBar && n > 1 && beats % n !== 0 && n % beats !== 0) {
    st.problem(i, 'warning', `A bar has ${n} beats' worth of chords in ${bar.time.join('/')}, so each gets ${+(beats / n).toFixed(2)} beats. Use . to fill beats, or [ ] to squeeze chords into one beat.`);
  }
  flatten(bar.slots, 0, 1, bar.events);
  bar.onsets = bar.events.filter((e) => e.kind === 'chord' || e.kind === 'rest' || e.kind === 'text');
  if (!bar.repeatsBar) countNumbers(st, bar, i);
  applyEvery(st, bar);
  st.lastBar = bar;
  return bar;
}

function countNumbers(st, bar, i) {
  if (st.warnedNumbers || st.key) return;
  if (bar.events.some((e) => e.chord?.numeric)) {
    st.warnedNumbers = true;
    st.problem(i, 'warning', 'Numbers (1 4 5 6m) need a key to turn into chords. Add "key: G" (or your key) to the header.');
  }
}

// Splits a bar's text into tokens: chords, ., -, %, [, ], { … }, keeping "quoted text" in one piece.
export function tokenize(text) {
  const out = [];
  let cur = '';
  const push = () => {
    if (cur) out.push(cur);
    cur = '';
  };
  for (let j = 0; j < text.length; j += 1) {
    const c = text[j];
    if (/\s/.test(c)) push();
    else if (c === '[' || c === ']') {
      push();
      out.push(c);
    } else if (c === '{') {
      push();
      const end = text.indexOf('}', j);
      if (end < 0) throw new Error(`A { … } instruction isn't closed: ${text.slice(j).trim()}`);
      out.push(text.slice(j, end + 1));
      j = end;
    } else if (c === '"') {
      const end = text.indexOf('"', j + 1);
      if (end < 0) throw new Error(`A quote isn't closed: ${text.slice(j).trim()}`);
      cur += text.slice(j, end + 1);
      j = end;
    } else cur += c;
  }
  push();
  return out;
}

// Tokens → slots. Each slot gets an equal share of its bar (or of its [ group ]).
function buildSlots(tokens, st, i) {
  const stack = [[]];
  for (const t of tokens) {
    if (t === '[') stack.push([]);
    else if (t === ']') {
      if (stack.length === 1) throw new Error('A ] has no [ to match it.');
      const children = stack.pop();
      if (!children.length) throw new Error('[ ] is empty: put two or more chords inside to split the beat.');
      stack[stack.length - 1].push({ kind: 'group', children, marks: [] });
    } else if (t.startsWith('{')) {
      st.problem(i, 'warning', `Instructions like ${t} go at the start of a bar or on their own line.`);
    } else stack[stack.length - 1].push(readSlot(t, st, i));
  }
  if (stack.length > 1) throw new Error('A [ is never closed with ].');
  return stack[0];
}

function readSlot(token, st, i) {
  const at = token.search(/[!*]/);
  const base = at < 0 ? token : token.slice(0, at);
  const marks = at < 0 ? [] : readMarks(token.slice(at), st, i);
  if (base === '.' || base === '/' || base === '') return { kind: 'hold', marks };
  if (base === '-' || /^n\.?c\.?$/i.test(base) || base === 'x') return { kind: 'rest', symbol: 'N.C.', marks };
  const chord = parseChord(base);
  if (chord) return { kind: 'chord', symbol: base, chord, marks };
  st.problem(i, 'error', `"${base}" isn't a chord I can read. It's shown as written.`);
  return { kind: 'text', symbol: base, marks };
}

// "!*hit*\"Drums out\"" → [{ name: 'accent' }, { name: 'hit' }, { text: 'Drums out' }]
function readMarks(text, st, i) {
  const out = [];
  const re = /!|\*"([^"]*)"|\*([A-Za-z][\w-]*)/g;
  let m;
  let used = 0;
  while ((m = re.exec(text))) {
    if (m.index !== used) break;
    used = re.lastIndex;
    if (m[0] === '!') out.push({ name: 'accent' });
    else if (m[1] != null) out.push({ text: m[1] });
    else {
      out.push({ name: m[2] });
      st.usedMarks.add(m[2]);
    }
  }
  if (used !== text.length) st.problem(i, 'warning', `I couldn't read the notation "${text.slice(used)}". Write *name or *"some text".`);
  return out;
}

function flatten(slots, start, length, out) {
  const share = length / slots.length;
  slots.forEach((slot, j) => {
    const s = start + j * share;
    if (slot.kind === 'group') {
      const before = out.length;
      flatten(slot.children, s, share, out);
      if (slot.marks.length && out[before]) out[before].marks = [...slot.marks, ...out[before].marks];
    } else {
      out.push({ start: s, length: share, kind: slot.kind, symbol: slot.symbol ?? null, chord: slot.chord ?? null, marks: slot.marks });
    }
  });
}

// A lyric line under a bar line. ^ marks the syllable where each chord lands. | in the words
// (optional) says where each bar starts, so the ^ marks in that piece belong to that bar.
function lyricRow(st, text, line, i) {
  const segments = [];
  const bars = line.bars;
  const onsetsIn = (b) => bars[b]?.onsets.length ?? 0;
  if (text.includes('|')) {
    const chunks = text.split('|');
    if (chunks.length > bars.length) {
      st.problem(i, 'warning', `These words have ${chunks.length} bars (split by |) but the line above has ${bars.length}.`);
    }
    chunks.forEach((chunk, b) => {
      const bar = Math.min(b, bars.length - 1);
      const pieces = chunk.split('^');
      if (pieces[0].trim() || pieces.length === 1) segments.push({ bar, onset: pieces.length === 1 && b < bars.length && onsetsIn(bar) ? 0 : null, text: pieces[0] });
      for (let k = 1; k < pieces.length; k += 1) {
        const onset = k - 1 < onsetsIn(bar) ? k - 1 : null;
        if (onset == null) st.problem(i, 'warning', `Bar ${b + 1} of these words has more ^ marks than chords.`);
        segments.push({ bar, onset, text: pieces[k] });
      }
    });
  } else {
    const pieces = text.split('^');
    let bar = 0;
    let onset = -1;
    if (pieces.length === 1) segments.push({ bar: 0, onset: onsetsIn(0) ? 0 : null, text: pieces[0] });
    else {
      if (pieces[0]) segments.push({ bar: 0, onset: null, text: pieces[0] });
      for (let k = 1; k < pieces.length; k += 1) {
        // the next chord along, moving into the next bar when this one runs out
        onset += 1;
        while (bar < bars.length && onset >= onsetsIn(bar)) {
          bar += 1;
          onset = 0;
        }
        if (bar >= bars.length) {
          st.problem(i, 'warning', 'These words have more ^ marks than there are chords above them.');
          segments[segments.length - 1].text += pieces.slice(k).join('');
          break;
        }
        segments.push({ bar, onset, text: pieces[k] });
      }
    }
  }
  return segments;
}
