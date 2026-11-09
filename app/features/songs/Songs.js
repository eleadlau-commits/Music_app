// Songs: the song list (the tab the app opens on), importing .chords files, and pasting
// what Claude wrote. A file can hold several songs (split by ---); each becomes its own song.
// Opening a song uses the `chart` service if it's there, or shows the file as text.
//
// Saved data: 'songs' → [{ id, text, added, updated }] (the .chords text of each song).

import { Feature, ui } from 'folio';
import { newId, summary, titleOf, matches, byTitle } from './library.js';

const { el } = ui;

export default class Songs extends Feature {
  start() {
    this.chords = this.use('chords');
    this.songs = this.storage.get('songs', []);
    this.cache = new Map(); // id → { text, parsed }
    this.query = '';

    // The two made-up examples, the first time the app opens, so there's something to try.
    this.storage.once('examples', () => {
      if (!this.songs.length) for (const ex of this.chords.examples) this.addText(ex.text, { quiet: true });
    });

    this.provide('songs', {
      list: () => this.entries(),
      get: (id) => this.songs.find((s) => s.id === id) || null,
      parsed: (id) => this.parsed(id),
      add: (text) => this.addText(text),
      update: (id, text) => this.update(id, text),
      remove: (id) => this.remove(id),
      import: () => this.openImport(),
    });

    this.add('views', {
      id: 'songs', label: 'Songs', icon: 'book', order: 10, start: true,
      subtitle: () => `${this.songs.length} song${this.songs.length === 1 ? '' : 's'}`,
      mount: (container, { head, actions }) => {
        this.search = el('input', {
          type: 'text', enterkeyhint: 'search', class: 'songs-search', placeholder: 'Search songs, artists or keys',
          'aria-label': 'Search songs', oninput: (e) => { this.query = e.target.value; this.drawList(); },
        });
        head.append(this.search);
        actions.append(el('button', { type: 'button', class: 'icon-btn ghost', 'aria-label': 'Add songs', title: 'Add songs', onclick: () => this.openImport() }, ui.icon('plus')));
        this.list = el('div', { class: 'songs-list' });
        container.append(this.list);
      },
      render: () => this.drawList(),
    });
  }

  // The parsed form of a song, worked out once per change.
  parsed(id) {
    const song = this.songs.find((s) => s.id === id);
    if (!song) return null;
    const hit = this.cache.get(id);
    if (hit && hit.text === song.text) return hit.parsed;
    const parsed = this.chords.parseSong(song.text);
    this.cache.set(id, { text: song.text, parsed });
    return parsed;
  }

  entries() {
    return this.songs.map((s) => {
      const p = this.parsed(s.id);
      return {
        id: s.id, title: titleOf(p, s.text), artist: p?.artist || '', key: p?.key?.name || '',
        line: summary(p), problems: p ? p.problems.filter((x) => x.level === 'error').length : 0,
        added: s.added, updated: s.updated,
      };
    }).sort(byTitle);
  }

  save() {
    if (!this.storage.set('songs', this.songs)) return false;
    this.emit('songs:changed', { count: this.songs.length });
    this.refresh();
    return true;
  }

  // Adds every song in a file. Returns the new ids.
  addText(text, { quiet = false } = {}) {
    const found = this.chords.parseFile(text);
    if (!found.length) {
      if (!quiet) this.toast('There were no songs in that.');
      return [];
    }
    const taken = new Set(this.songs.map((s) => s.id));
    const now = Date.now();
    const ids = found.map((song, i) => {
      const id = newId(taken, now + i);
      taken.add(id);
      this.songs.push({ id, text: song.source, added: now, updated: now });
      return id;
    });
    this.save();
    // A file shared from a set list starts with "// Set: name"; tell set lists about it.
    const first = String(text).split('\n').find((l) => l.trim())?.trim() || '';
    const set = first.match(/^\/\/\s*Set:\s*(.+)$/);
    this.emit('songs:imported', { ids, set: set ? set[1].trim() : null });
    if (!quiet) this.toast(ids.length === 1 ? `Added "${titleOf(found[0], found[0].source)}".` : `Added ${ids.length} songs.`);
    return ids;
  }

  update(id, text) {
    const song = this.songs.find((s) => s.id === id);
    if (!song) return false;
    song.text = text;
    song.updated = Date.now();
    return this.save();
  }

  remove(id) {
    const before = this.songs.length;
    this.songs = this.songs.filter((s) => s.id !== id);
    this.cache.delete(id);
    if (this.songs.length !== before) this.save();
  }

  open(id) {
    const chart = this.use('chart');
    if (chart) return chart.open(id);
    // Without the chart feature: the file as text.
    const song = this.songs.find((s) => s.id === id);
    const d = ui.dialog({ title: titleOf(this.parsed(id), song.text), onClose: () => d.element.remove() });
    d.setContent(el('pre', { class: 'songs-raw' }, song.text));
    d.open();
  }

  drawList() {
    if (!this.list) return;
    const all = this.entries();
    const shown = all.filter((e) => matches(e, this.query));
    if (!all.length) {
      this.list.replaceChildren(
        ui.missing('No songs yet. Tap + to paste a chart from Claude or choose a .chords file.'),
        el('button', { type: 'button', class: 'btn primary block', onclick: () => this.openImport() }, 'Add songs'));
      return;
    }
    if (!shown.length) {
      this.list.replaceChildren(el('p', { class: 'empty' }, `No songs match "${this.query}".`));
      return;
    }
    this.list.replaceChildren(...shown.map((e) => el('div', {
      class: 'song-row', role: 'button', tabindex: '0',
      onclick: () => this.open(e.id),
      onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.open(e.id); } },
    },
    el('div', { class: 'song-main' },
      el('div', { class: 'song-title' }, e.title),
      el('div', { class: 'song-sub' }, [e.artist, e.line].filter(Boolean).join(' — '))),
    e.problems ? el('span', { class: 'song-flag', title: 'Some chords couldn\'t be read' }, `${e.problems} to fix`) : null,
    ui.icon('right'))));
  }

  // The Add songs window: paste text, or choose a file, and see what will be added.
  openImport() {
    const d = ui.dialog({ title: 'Add songs', className: 'songs-import', onClose: () => d.element.remove() });
    const box = el('textarea', {
      class: 'field songs-paste', rows: '12', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
      placeholder: 'Paste a chart here: what Claude wrote, or a .chords file.\n\ntitle: My Song\nkey: G\n\n[Verse]\n| G . . . | C . D . |\n^Words go ^under the ^chords',
      oninput: () => preview(),
    });
    const found = el('div', { class: 'songs-found' });
    const add = el('button', { type: 'button', class: 'btn primary block', disabled: true, onclick: () => {
      const ids = this.addText(box.value);
      if (ids.length) {
        d.close();
        if (ids.length === 1) this.open(ids[0]);
      }
    } }, 'Add');
    // Any file: phones don't know the .chords type, so a filter (".chords" or text/plain) greys
    // the files out on Android and iPhone. What's inside is checked once it's read.
    const picker = ui.filePicker('');
    const preview = () => {
      const songs = box.value.trim() ? this.chords.parseFile(box.value) : [];
      add.disabled = !songs.length;
      add.textContent = songs.length > 1 ? `Add ${songs.length} songs` : 'Add';
      found.replaceChildren(...songs.map((s) => {
        const errors = s.problems.filter((p) => p.level === 'error').length;
        return el('div', { class: 'songs-found-row' },
          el('b', {}, titleOf(s, s.source)),
          el('span', { class: 'hint small' }, [summary(s), errors ? `${errors} chord${errors === 1 ? '' : 's'} to fix` : 'reads fine'].filter(Boolean).join(' · ')));
      }));
    };
    d.setContent(
      box,
      el('div', { class: 'row songs-import-buttons' },
        navigator.clipboard?.readText ? el('button', { type: 'button', class: 'btn', onclick: async () => {
          try {
            box.value = await navigator.clipboard.readText();
            preview();
          } catch {
            this.toast('Couldn\'t read what you copied. Press and hold in the box, then Paste.');
          }
        } }, 'Paste') : null,
        el('button', { type: 'button', class: 'btn', onclick: async () => {
          const file = await picker.pick();
          if (!file) return;
          if (file.size > 2_000_000) return this.toast('That file is too big to be a chart.');
          const text = await file.text();
          if (text.includes('\u0000')) return this.toast(`"${file.name}" isn't a text file. Choose a .chords or .txt file.`);
          box.value = text;
          preview();
          if (!this.chords.parseFile(text).length) this.toast(`There are no songs in "${file.name}".`);
        } }, 'Choose a file')),
      found,
      add,
      ui.hint('Tip: ask Claude for a chart "in the Chords format" (Guide tab → Copy the prompt), then paste its answer here. Several songs at once is fine.', { small: true }));
    d.open();
    box.focus();
  }
}
