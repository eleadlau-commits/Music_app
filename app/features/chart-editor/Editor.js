// Chart editor: Edit in a chart's ⋮ menu. A text box with the song's .chords text, quick keys
// for the symbols that are slow to reach on a phone keyboard, problems listed as you type
// (with line numbers), and a preview. Save puts it back into the song list.
//
// Saved data: 'draft' → { id, text } (what you were typing, if the app closed before Save).

import { Feature, ui } from 'folio';
import { QUICK_KEYS, ROOTS, insertAt } from './keys.js';

const { el } = ui;

export default class Editor extends Feature {
  start() {
    this.songs = this.use('songs');
    this.chords = this.use('chords');
    this.add('chart.tools', { id: 'edit', label: 'Edit', icon: 'note', order: 10, onClick: (id, chart) => this.open(id, chart) });
  }

  open(id, chart) {
    const song = this.songs.get(id);
    if (!song) return;
    const draft = this.storage.get('draft');
    const start = draft?.id === id && draft.text !== song.text ? draft.text : song.text;
    let saved = song.text;

    const d = ui.dialog({ title: 'Edit', className: 'editor-dialog', onClose: () => d.element.remove() });
    const box = el('textarea', {
      class: 'editor-text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off',
      'aria-label': 'The song as .chords text', oninput: () => changed(),
    });
    box.value = start;
    const status = el('div', { class: 'editor-status' });
    const preview = el('div', { class: 'editor-preview', hidden: true });
    const type = (key) => {
      const r = insertAt(box.value, box.selectionStart, box.selectionEnd, key);
      box.value = r.value;
      box.focus();
      box.setSelectionRange(r.cursor, r.cursor);
      changed();
    };
    const keyRow = (keys) => el('div', { class: 'editor-keys', 'data-own-swipe': true },
      keys.map((k) => el('button', {
        type: 'button', class: 'editor-key', title: k.title || null,
        onpointerdown: (e) => e.preventDefault(), // keep the keyboard open
        onclick: () => type(k),
      }, typeof k === 'string' ? k : k.label)));

    let timer;
    const changed = () => {
      this.storage.set('draft', { id, text: box.value });
      clearTimeout(timer);
      timer = setTimeout(check, 250);
    };
    const check = () => {
      const songs = this.chords.parseFile(box.value);
      const problems = songs.flatMap((s) => s.problems);
      status.replaceChildren(...[
        songs.length > 1 ? el('p', { class: 'editor-note' }, `This holds ${songs.length} songs (split by ---). Saving keeps the first here and adds the rest as new songs.`) : null,
        problems.length
          ? el('ul', { class: 'editor-problems' }, problems.slice(0, 8).map((p) => el('li', { class: p.level, onclick: () => p.line && goToLine(p.line) }, p.line ? el('b', {}, `Line ${p.line}: `) : null, p.message)))
          : el('p', { class: 'editor-ok' }, '✓ Reads fine'),
      ].filter(Boolean));
      if (!preview.hidden) drawPreview();
    };
    const goToLine = (n) => {
      const lines = box.value.split('\n');
      const pos = lines.slice(0, n - 1).join('\n').length + (n > 1 ? 1 : 0);
      box.focus();
      box.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
    };
    const drawPreview = () => {
      const chart = this.use('chart');
      preview.replaceChildren(chart ? chart.render(box.value.split(/^-{3,}\s*$/m)[0]) : ui.missing('The chart feature is switched off.'));
    };
    const save = () => {
      const parts = this.chords.parseFile(box.value);
      if (!parts.length) return this.toast('There\'s nothing to save.');
      this.songs.update(id, parts[0].source);
      for (const extra of parts.slice(1)) this.songs.add(extra.source);
      saved = parts[0].source;
      this.storage.remove('draft');
      chart?.redraw();
      d.close();
      this.toast('Saved.');
    };

    d.setContent(
      el('div', { class: 'editor-bar' },
        el('button', { type: 'button', class: 'btn', onclick: () => {
          preview.hidden = !preview.hidden;
          box.hidden = !preview.hidden;
          if (!preview.hidden) drawPreview();
          previewBtn.textContent = preview.hidden ? 'Preview' : 'Back to text';
        } }, 'Preview'),
        el('button', { type: 'button', class: 'btn', onclick: () => {
          if (box.value !== saved) {
            box.value = saved;
            this.storage.remove('draft');
            check();
            this.toast('Changes undone.');
          } else d.close();
        } }, 'Undo'),
        el('button', { type: 'button', class: 'btn primary', onclick: save }, 'Save')),
      draft?.id === id && draft.text !== song.text ? el('p', { class: 'editor-note' }, 'This is what you were typing last time, not saved yet. Undo goes back to the saved song.') : null,
      keyRow(QUICK_KEYS),
      keyRow(ROOTS),
      box,
      preview,
      status);
    const previewBtn = d.content.querySelector('.editor-bar .btn');
    d.open();
    check();
  }
}
