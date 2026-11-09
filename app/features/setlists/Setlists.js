// Set lists: the Sets tab. Make a set for a gig, add songs, put them in order, and play it:
// each chart has Previous and Next (through the `chart` service). Add to a set from a chart's
// ⋮ menu. Share a set as one .chords file; importing that file in Songs makes the set again.
//
// Saved data: 'sets' → [{ id, name, songs: [song id], created, updated }].

import { Feature, ui } from 'folio';
import { newSet, tidyName, addSongs, removeAt, move, liveSongs, setFile } from './sets.js';

const { el } = ui;
// A list with a play mark, for the tab.
const SET_ICON = '<path d="M4 6h11M4 11h11M4 16h7"/><path d="M15 14.5v6l5-3z"/>';

export default class Setlists extends Feature {
  start() {
    this.songs = this.use('songs');
    this.sets = this.storage.get('sets', []);

    this.provide('setlists', {
      list: () => this.sets.map((s) => ({ ...s })),
      addTo: (setId, songIds) => this.update(setId, (s) => addSongs(s, songIds)),
    });

    this.add('views', {
      id: 'sets', label: 'Sets', icon: SET_ICON, order: 15,
      subtitle: () => `${this.sets.length} set${this.sets.length === 1 ? '' : 's'}`,
      mount: (container, { actions }) => {
        actions.append(el('button', { type: 'button', class: 'icon-btn ghost', 'aria-label': 'New set', title: 'New set', onclick: () => this.askName() }, ui.icon('plus')));
        this.list = el('div', { class: 'sets-list' });
        container.append(this.list);
      },
      render: () => this.drawList(),
    });

    this.add('chart.tools', { id: 'add-to-set', label: 'Add to a set', icon: 'plus', order: 20, onClick: (id) => this.pickSetFor(id) });

    this.on('songs:changed', () => { if (this.openSet) this.drawSet(); });
    // A file shared from a set ("// Set: name" at the top) comes back as that set.
    this.on('songs:imported', ({ ids, set }) => {
      if (!set || !ids?.length) return;
      const made = this.create(set, ids);
      this.toast(`Made the set "${made.name}" with ${ids.length} song${ids.length === 1 ? '' : 's'}.`);
    });
  }

  save() {
    this.storage.set('sets', this.sets);
    this.refresh();
  }

  create(name, ids = []) {
    const set = addSongs(newSet(name, new Set(this.sets.map((s) => s.id))), ids);
    this.sets.push(set);
    this.save();
    return set;
  }

  update(id, change) {
    const i = this.sets.findIndex((s) => s.id === id);
    if (i < 0) return null;
    this.sets[i] = change(this.sets[i]);
    this.save();
    if (this.openSet?.id === id) this.drawSet();
    return this.sets[i];
  }

  exists = (id) => Boolean(this.songs?.get(id));

  title(id) {
    return this.songs?.parsed(id)?.title || 'Untitled song';
  }

  drawList() {
    if (!this.list) return;
    if (!this.sets.length) {
      this.list.replaceChildren(
        ui.missing('No sets yet. Make one for your next gig, then add songs in the order you\'ll play them.'),
        el('button', { type: 'button', class: 'btn primary block', onclick: () => this.askName() }, 'New set'));
      return;
    }
    const sorted = [...this.sets].sort((a, b) => b.updated - a.updated);
    this.list.replaceChildren(...sorted.map((s) => {
      const live = liveSongs(s, this.exists);
      return el('div', {
        class: 'set-row', role: 'button', tabindex: '0',
        onclick: () => this.openSetScreen(s.id),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openSetScreen(s.id); } },
      },
      el('div', { class: 'set-main' },
        el('div', { class: 'set-name' }, s.name),
        el('div', { class: 'set-sub' }, live.length ? `${live.length} song${live.length === 1 ? '' : 's'} · ${live.slice(0, 3).map((id) => this.title(id)).join(', ')}${live.length > 3 ? '…' : ''}` : 'No songs yet')),
      ui.icon('right'));
    }));
  }

  // A small box asking for a name: for a new set (then it opens), or to rename one.
  askName(set = null, after = null) {
    const d = ui.dialog({ title: set ? 'Rename the set' : 'New set', size: 'box', onClose: () => d.element.remove() });
    const input = el('input', { type: 'text', value: set?.name || '', placeholder: 'e.g. Friday at The Anchor', maxlength: '60', 'aria-label': 'Set name' });
    const done = () => {
      d.close();
      if (set) this.update(set.id, (s) => ({ ...s, name: tidyName(input.value), updated: Date.now() }));
      else {
        const made = this.create(input.value);
        if (after) after(made);
        else this.openSetScreen(made.id);
      }
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    d.setContent(input, el('button', { type: 'button', class: 'btn primary block', onclick: done }, set ? 'Save' : 'Make the set'));
    d.open();
    input.focus();
  }

  // The set, full screen: play, add songs, put them in order.
  openSetScreen(id) {
    const d = ui.dialog({ title: '', className: 'set-dialog', onClose: () => { this.openSet = null; d.element.remove(); } });
    this.openSet = { id, d };
    this.drawSet();
    d.open();
  }

  drawSet() {
    const cur = this.openSet;
    const set = cur && this.sets.find((s) => s.id === cur.id);
    if (!set) return cur?.d.close();
    cur.d.setTitle(set.name);
    const live = liveSongs(set, this.exists);
    const play = (from) => {
      const chart = this.use('chart');
      if (!chart) return this.toast('Charts are switched off (Settings → Features).');
      chart.open(from, { list: { name: set.name, ids: live } });
    };
    const rows = set.songs.map((songId, i) => {
      if (!this.exists(songId)) return null;
      const p = this.songs.parsed(songId);
      const n = live.indexOf(songId) + 1;
      return el('li', { class: 'set-song' },
        el('span', { class: 'set-num' }, String(n)),
        el('button', { type: 'button', class: 'set-song-main', onclick: () => play(songId) },
          el('b', {}, p?.title || 'Untitled song'),
          el('span', {}, [p?.key?.name, p?.tempo && `${p.tempo} bpm`].filter(Boolean).join(' · '))),
        el('div', { class: 'set-song-tools' },
          el('button', { type: 'button', class: 'icon-btn ghost', 'aria-label': 'Move up', disabled: n === 1, onclick: () => this.update(set.id, (s) => move(s, i, prevLive(set.songs, i, this.exists) - i)) }, ui.icon('<path d="M6 15l6-6 6 6"/>')),
          el('button', { type: 'button', class: 'icon-btn ghost', 'aria-label': 'Move down', disabled: n === live.length, onclick: () => this.update(set.id, (s) => move(s, i, nextLive(set.songs, i, this.exists) - i)) }, ui.icon('<path d="M6 9l6 6 6-6"/>')),
          el('button', { type: 'button', class: 'icon-btn ghost', 'aria-label': 'Take out of the set', onclick: () => this.update(set.id, (s) => removeAt(s, i)) }, ui.icon('close'))));
    });
    cur.d.setContent(
      el('div', { class: 'set-actions' },
        el('button', { type: 'button', class: 'btn primary', disabled: !live.length, onclick: () => play(live[0]) }, '▶  Play the set'),
        el('button', { type: 'button', class: 'btn', onclick: () => this.pickSongs(set.id) }, 'Add songs')),
      live.length
        ? el('ol', { class: 'set-songs' }, rows)
        : ui.missing('No songs in this set yet. Tap Add songs.'),
      el('div', { class: 'set-more' },
        el('button', { type: 'button', class: 'btn small', onclick: () => this.askName(set) }, 'Rename'),
        el('button', { type: 'button', class: 'btn small', disabled: !live.length, onclick: () => this.share(set) }, 'Share as one file'),
        el('button', { type: 'button', class: 'btn small danger', onclick: () => this.confirmDelete(set) }, 'Delete set')),
      ui.hint('Playing a set opens each chart with Previous and Next. Deleting a set keeps its songs.', { small: true }));
  }

  // Tick songs to add (ones already in the set are shown ticked and can't be added twice).
  pickSongs(setId) {
    const set = this.sets.find((s) => s.id === setId);
    const all = this.songs.list();
    const picked = new Set();
    const d = ui.dialog({ title: 'Add songs', onClose: () => d.element.remove() });
    if (!all.length) {
      d.setContent(ui.missing('There are no songs yet. Add some on the Songs tab first.'));
      return d.open();
    }
    const search = el('input', { type: 'text', placeholder: 'Search', 'aria-label': 'Search songs', oninput: () => draw() });
    const list = el('div', { class: 'set-pick' });
    const add = el('button', { type: 'button', class: 'btn primary block', disabled: true, onclick: () => {
      // in the order they appear in the song list
      this.update(setId, (s) => addSongs(s, all.map((e) => e.id).filter((id) => picked.has(id))));
      d.close();
    } }, 'Add');
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      list.replaceChildren(...all.filter((e) => !q || `${e.title} ${e.artist}`.toLowerCase().includes(q)).map((e) => {
        const already = set.songs.includes(e.id);
        return el('label', { class: `check set-pick-row${already ? ' already' : ''}` },
          el('input', { type: 'checkbox', checked: already || picked.has(e.id), disabled: already, onchange: (ev) => {
            if (ev.target.checked) picked.add(e.id);
            else picked.delete(e.id);
            add.disabled = !picked.size;
            add.textContent = picked.size > 1 ? `Add ${picked.size} songs` : 'Add';
          } }),
          el('span', {}, el('b', {}, e.title), e.artist || e.line ? el('small', {}, [e.artist, e.line].filter(Boolean).join(' — ')) : null));
      }));
    };
    draw();
    d.setContent(search, list, add);
    d.open();
  }

  // From a chart's ⋮ menu.
  pickSetFor(songId) {
    const d = ui.dialog({ title: 'Add to a set', size: 'box', onClose: () => d.element.remove() });
    const addTo = (set) => {
      d.close();
      if (set.songs.includes(songId)) return this.toast(`It's already in "${set.name}".`);
      this.update(set.id, (s) => addSongs(s, [songId]));
      this.toast(`Added to "${set.name}".`);
    };
    d.setContent(el('div', { class: 'chart-tool-list' },
      [...this.sets].sort((a, b) => b.updated - a.updated).map((s) => el('button', { type: 'button', class: 'chart-tool', onclick: () => addTo(s) },
        s.name, s.songs.includes(songId) ? el('small', { class: 'set-in' }, ' (already in it)') : null)),
      el('button', { type: 'button', class: 'chart-tool', onclick: () => { d.close(); this.askName(null, (made) => addTo(made)); } }, ui.icon('plus'), 'New set…')));
    d.open();
  }

  async share(set) {
    const texts = liveSongs(set, this.exists).map((id) => this.songs.get(id).text);
    const name = `${set.name.replace(/[^\w\- ]+/g, '').trim() || 'set'}.chords`;
    const file = new File([setFile(set, texts)], name, { type: 'text/plain' });
    try {
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: set.name });
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

  confirmDelete(set) {
    const d = ui.dialog({ title: 'Delete this set?', size: 'box', onClose: () => d.element.remove() });
    d.setContent(
      el('p', {}, `"${set.name}" will be deleted. Its songs stay in your song list.`),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn', onclick: () => d.close() }, 'Keep it'),
        el('button', { type: 'button', class: 'btn danger', onclick: () => {
          d.close();
          this.sets = this.sets.filter((s) => s.id !== set.id);
          this.save();
          this.openSet?.d.close();
          this.toast('Set deleted.');
        } }, 'Delete')));
    d.open();
  }
}

// The index of the song before / after i that still exists (to move past deleted ones).
function prevLive(songs, i, exists) {
  for (let j = i - 1; j >= 0; j -= 1) if (exists(songs[j])) return j;
  return i;
}

function nextLive(songs, i, exists) {
  for (let j = i + 1; j < songs.length; j += 1) if (exists(songs[j])) return j;
  return i;
}
