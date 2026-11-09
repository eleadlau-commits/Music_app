// Chart view: a song as a chart, full screen. Bars with each chord placed by beat, lyric lines
// with each chord over its word, notations, time and key changes. Transpose, letters or
// Nashville numbers, text size, lyrics on or off, and scrolling by itself while you play.
// The screen stays on while a chart is open (where the phone allows it).
//
// Saved data: 'songs' → { [song id]: { semitones, mode } } (each song's own choices),
//             'view' → { size, lyrics, speed } (for every song).

import { Feature, ui } from 'folio';
import { layout } from './layout.js';

const { el } = ui;
const SPEEDS = [{ id: 1, label: 'Slow', px: 12 }, { id: 2, label: 'Medium', px: 24 }, { id: 3, label: 'Fast', px: 42 }];

export default class Chart extends Feature {
  start() {
    this.songs = this.use('songs');
    this.chords = this.use('chords');
    this.prefs = this.storage.get('songs', {});
    this.view = { size: 1, lyrics: true, speed: 2, ...this.storage.get('view', {}) };

    this.defineSlot('chart.tools', 'Buttons in a chart\'s ⋮ menu: { id, label, icon, order, onClick(songId, chart) } where chart has close() and redraw().');
    this.add('chart.tools', { id: 'share', label: 'Share or save the file', icon: 'link', order: 80, onClick: (id) => this.share(id) });
    this.add('chart.tools', { id: 'delete', label: 'Delete this song', icon: 'trash', order: 90, onClick: (id, chart) => this.confirmDelete(id, chart) });

    this.provide('chart', {
      // list: { name, ids } plays a set: Previous and Next move through ids, starting at id.
      open: (id, { list } = {}) => this.open(id, list),
      // A chart drawn from text, for other features to show (e.g. the format guide's examples).
      render: (text, opts = {}) => this.draw(layout(this.chords.parseSong(text), this.chords, { lyrics: true, ...opts })),
    });
  }

  savePrefs() {
    this.storage.set('songs', this.prefs);
    this.storage.set('view', this.view);
  }

  open(id, list = null) {
    const song = this.songs.get(id);
    if (!song) return;
    this.current?.d.close();
    const d = ui.dialog({ title: '', className: 'chart-dialog', onClose: () => { this.current = null; this.stopScroll(); this.releaseWake(); d.element.remove(); } });
    this.current = { id, d, list: list?.ids?.length ? { name: list.name || 'Set', ids: list.ids } : null };
    this.keepAwake();
    this.drawOpen();
    d.open();
  }

  // Draws (or redraws) the open chart.
  drawOpen() {
    const cur = this.current;
    if (!cur) return;
    const parsed = this.songs.parsed(cur.id);
    if (!parsed) return cur.d.close();
    const mine = this.prefs[cur.id] || {};
    const semitones = mine.semitones || 0;
    const numericChart = isMostlyNumbers(parsed);
    const mode = mine.mode || (numericChart ? 'numbers' : 'letters');
    const model = layout(parsed, this.chords, { semitones, mode, lyrics: this.view.lyrics });
    cur.d.setTitle(model.title || 'Untitled song');
    const scrollTop = cur.d.element.scrollTop;
    cur.d.setContent(
      this.setBar(cur),
      this.toolbar(cur.id, parsed, model, { semitones, mode }),
      this.problems(parsed),
      this.draw(model),
      this.nextUp(cur),
      this.playButton());
    cur.d.element.scrollTop = scrollTop;
  }

  // Playing a set: where we are, and Previous / Next.
  setBar(cur) {
    if (!cur.list) return null;
    const i = cur.list.ids.indexOf(cur.id);
    const n = cur.list.ids.length;
    return el('div', { class: 'chart-set' },
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Previous song', disabled: i <= 0, onclick: () => this.go(-1) }, ui.icon('left')),
      el('div', { class: 'chart-set-name' }, el('b', {}, cur.list.name), el('span', {}, `${i + 1} of ${n}`)),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Next song', disabled: i >= n - 1, onclick: () => this.go(1) }, ui.icon('right')));
  }

  nextUp(cur) {
    if (!cur.list) return null;
    const i = cur.list.ids.indexOf(cur.id);
    const nextId = cur.list.ids[i + 1];
    if (!nextId) return el('p', { class: 'chart-set-end' }, `End of ${cur.list.name}`);
    const next = this.songs.parsed(nextId);
    return el('button', { type: 'button', class: 'btn primary block chart-next', onclick: () => this.go(1) }, `Next: ${next?.title || 'Untitled song'}`);
  }

  go(step) {
    const cur = this.current;
    if (!cur?.list) return;
    const ids = cur.list.ids.filter((id) => this.songs.get(id)); // skip songs deleted since
    const i = ids.indexOf(cur.id);
    const to = ids[i + step];
    if (!to) return;
    cur.list.ids = ids;
    this.stopScroll();
    cur.id = to;
    this.drawOpen();
    cur.d.element.scrollTop = 0;
  }

  setPref(id, change) {
    this.prefs[id] = { ...(this.prefs[id] || {}), ...change };
    this.savePrefs();
    this.drawOpen();
  }

  toolbar(id, parsed, model, { semitones, mode }) {
    const keyLabel = model.key ? model.key.name : (semitones ? `${semitones > 0 ? '+' : ''}${semitones}` : 'Key');
    const seg = (options, value, onPick, label) => el('div', { class: 'seg', role: 'tablist', 'aria-label': label, style: `--tabs: ${options.length}` },
      options.map((o) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(o.id === value), onclick: () => onPick(o.id) }, o.label)));
    return el('div', { class: 'chart-tools' },
      el('div', { class: 'chart-tools-row' },
        el('div', { class: 'chart-key', role: 'group', 'aria-label': 'Transpose' },
          el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Down a semitone', onclick: () => this.setPref(id, { semitones: wrap(semitones - 1) }) }, '−'),
          el('button', { type: 'button', class: 'chart-key-name', title: 'Back to the written key', onclick: () => this.setPref(id, { semitones: 0 }) },
            el('b', {}, keyLabel), semitones ? el('small', {}, `${semitones > 0 ? '+' : ''}${semitones}`) : null),
          el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Up a semitone', onclick: () => this.setPref(id, { semitones: wrap(semitones + 1) }) }, '+')),
        seg([{ id: 'letters', label: 'Chords' }, { id: 'numbers', label: '1 4 5' }], mode, (m) => this.setPref(id, { mode: m }), 'Show chords as')),
      el('div', { class: 'chart-tools-row' },
        el('div', { class: 'chart-size', role: 'group', 'aria-label': 'Text size' },
          el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Smaller text', onclick: () => this.setSize(-0.1) }, 'A−'),
          el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bigger text', onclick: () => this.setSize(0.1) }, 'A+')),
        seg([{ id: true, label: 'Lyrics' }, { id: false, label: 'Bars' }], this.view.lyrics, (v) => { this.view.lyrics = v; this.savePrefs(); this.drawOpen(); }, 'Show'),
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'More', title: 'More', onclick: () => this.openTools(id) }, ui.icon('dots'))));
  }

  setSize(step) {
    this.view.size = Math.round(Math.min(2.2, Math.max(0.7, this.view.size + step)) * 10) / 10;
    this.savePrefs();
    this.drawOpen();
  }

  problems(parsed) {
    const list = parsed.problems;
    if (!list.length) return null;
    const errors = list.filter((p) => p.level === 'error').length;
    return el('details', { class: `chart-problems ${errors ? 'has-errors' : ''}` },
      el('summary', {}, `${list.length} thing${list.length === 1 ? '' : 's'} to check in this file`),
      el('ul', {}, list.map((p) => el('li', {}, p.line ? el('b', {}, `Line ${p.line}: `) : null, p.message))));
  }

  // The chart itself.
  draw(model) {
    const markBadge = (m) => el('span', { class: 'mk', title: m.label }, m.symbol ? m.symbol : m.text);
    const barEl = (b, repeat) => el('div', { class: `bar${b.repeatsBar ? ' repeat' : ''}`, style: `flex-basis: ${b.width}em` },
      el('div', { class: 'bar-changes' },
        b.changes.time ? el('span', { class: 'time-sig' }, b.changes.time) : null,
        b.changes.key ? el('span', { class: 'key-change' }, `Key ${b.changes.key}`) : null,
        b.changes.tempo ? el('span', { class: 'tempo-change' }, `♩=${b.changes.tempo}`) : null,
        repeat > 1 ? el('span', { class: 'line-repeat' }, `×${repeat}`) : null),
      el('div', { class: 'bar-body' },
        b.events.filter((e) => e.label || e.marks.length).map((e) => el('span', { class: `ev ${e.kind}${e.tight ? ' tight' : ''}${e.raised ? ' raised' : ''}`, style: e.atEnd ? 'right: 0' : `left: ${(e.start * 100).toFixed(2)}%` },
          e.marks.length ? el('span', { class: 'mks' }, e.marks.map(markBadge)) : null,
          el('span', { class: 'ch' }, e.label))),
        b.marks.map((m) => el('span', { class: 'ev bar-mark', style: `left: ${(m.at * 100).toFixed(2)}%` }, el('span', { class: 'mks' }, markBadge(m)))),
        el('span', { class: 'beats', 'aria-hidden': 'true' }, Array.from({ length: b.beats }, () => el('i')))));
    const repeatTag = (n) => (n > 1 ? el('span', { class: 'line-repeat' }, `×${n}`) : null);

    const item = (it) => {
      if (it.type === 'cue') return el('p', { class: 'cue' }, it.text);
      if (it.type === 'text') return el('p', { class: 'words' }, it.text);
      if (it.type === 'bars') return el('div', { class: 'bars-line' }, it.bars.map((b, i) => barEl(b, i === it.bars.length - 1 ? it.repeat : 1)));
      return el('div', { class: 'lyric-block' },
        it.rows.map((row, i) => el('div', { class: 'lyric-row' },
          i === 0 ? repeatTag(it.repeat) : null,
          row.map((c) => el('span', { class: `cell${c.barStart ? ' bar-start' : ''}${c.empty ? ' empty' : ''}` },
            el('span', { class: 'cell-chord' },
              c.marks.length ? el('span', { class: 'mks' }, c.marks.map(markBadge)) : null,
              c.chord || '\u00a0'),
            el('span', { class: 'cell-words' }, c.text || '\u00a0'))))));
    };

    return el('div', { class: 'chart', style: `--chart-size: ${this.view.size}` },
      el('div', { class: 'chart-head' },
        model.artist ? el('div', { class: 'chart-artist' }, model.artist) : null,
        el('div', { class: 'chart-facts' }, model.facts.map((f) => el('span', {}, f))),
        model.notes ? el('p', { class: 'chart-notes' }, model.notes) : null,
        model.legend.length ? el('div', { class: 'chart-legend' }, model.legend.map((m) => el('span', {}, el('span', { class: 'mk' }, m.symbol), ` ${m.label}`))) : null),
      model.sections.map((s) => el('section', { class: 'chart-section' },
        s.name || s.repeat > 1 ? el('h3', { class: 'section-name' }, s.name || 'Section', s.repeat > 1 ? el('span', { class: 'line-repeat' }, `×${s.repeat}`) : null) : null,
        s.items.map(item))));
  }

  // Scrolling by itself: a round button at the bottom to start or stop, and one for the speed.
  playButton() {
    const speed = SPEEDS.find((s) => s.id === this.view.speed) || SPEEDS[1];
    const playing = Boolean(this.scrolling);
    return el('div', { class: 'chart-play' },
      el('button', { type: 'button', class: 'chart-speed', 'aria-label': `Scroll speed: ${speed.label}`, onclick: () => {
        this.view.speed = (speed.id % SPEEDS.length) + 1;
        this.savePrefs();
        this.drawOpen();
      } }, speed.label),
      el('button', { type: 'button', class: `chart-go${playing ? ' on' : ''}`, 'aria-label': playing ? 'Stop scrolling' : 'Scroll by itself', onclick: () => (this.scrolling ? this.stopScroll() : this.startScroll()) },
        playing ? '❚❚' : '▶'));
  }

  startScroll() {
    const box = this.current?.d.element;
    if (!box) return;
    let last = performance.now();
    let carry = 0;
    const step = (now) => {
      if (!this.scrolling) return;
      const px = (SPEEDS.find((s) => s.id === this.view.speed) || SPEEDS[1]).px;
      carry += ((now - last) / 1000) * px;
      last = now;
      const whole = Math.floor(carry);
      if (whole) {
        box.scrollTop += whole;
        carry -= whole;
      }
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 1) return this.stopScroll();
      this.scrolling = requestAnimationFrame(step);
    };
    this.scrolling = requestAnimationFrame(step);
    this.drawOpen();
  }

  stopScroll() {
    if (!this.scrolling) return;
    cancelAnimationFrame(this.scrolling);
    this.scrolling = null;
    if (this.current) this.drawOpen();
  }

  async keepAwake() {
    try {
      this.wake = await navigator.wakeLock?.request('screen');
    } catch {
      this.wake = null; // not allowed here; the chart works anyway
    }
  }

  releaseWake() {
    this.wake?.release?.().catch(() => {});
    this.wake = null;
  }

  openTools(id) {
    const d = ui.dialog({ title: 'This song', size: 'box', onClose: () => d.element.remove() });
    const chart = { close: () => this.current?.d.close(), redraw: () => this.drawOpen() };
    d.setContent(el('div', { class: 'chart-tool-list' }, this.slot('chart.tools').map((t) => el('button', {
      type: 'button', class: 'chart-tool', onclick: () => { d.close(); t.onClick(id, chart); },
    }, t.icon ? ui.icon(t.icon) : null, t.label))));
    d.open();
  }

  async share(id) {
    const song = this.songs.get(id);
    const parsed = this.songs.parsed(id);
    const name = `${(parsed?.title || 'song').replace(/[^\w\- ]+/g, '').trim() || 'song'}.chords`;
    const file = new File([song.text], name, { type: 'text/plain' });
    try {
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: parsed?.title || name });
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(file);
    const a = el('a', { href: url, download: name, hidden: true });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    this.toast(`Saved ${name}.`);
  }

  confirmDelete(id, chart) {
    const parsed = this.songs.parsed(id);
    const d = ui.dialog({ title: 'Delete this song?', size: 'box', onClose: () => d.element.remove() });
    d.setContent(
      el('p', {}, `"${parsed?.title || 'Untitled song'}" will be removed from this phone. Share or save the file first if you might want it again.`),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn', onclick: () => d.close() }, 'Keep it'),
        el('button', { type: 'button', class: 'btn danger', onclick: () => {
          d.close();
          chart.close();
          delete this.prefs[id];
          this.savePrefs();
          this.songs.remove(id);
          this.toast('Song deleted.');
        } }, 'Delete')));
    d.open();
  }
}

const wrap = (n) => ((((n + 6) % 12) + 12) % 12) - 6; // keep transposing within −6…+5

function isMostlyNumbers(song) {
  let numbers = 0;
  let letters = 0;
  for (const s of song.sections) for (const l of s.lines) for (const b of l.bars || []) for (const e of b.events) {
    if (e.chord?.numeric) numbers += 1;
    else if (e.chord) letters += 1;
  }
  return numbers > letters;
}
