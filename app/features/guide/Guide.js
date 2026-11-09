// Guide: the second tab. Getting a chart from Claude (type the song, copy the prompt, paste the
// answer back), the format's quick reference, and an example drawn as a chart.
//
// Saved data: none.

import { Feature, ui } from 'folio';
import { QUICK_REFERENCE, EXAMPLE, promptFor } from './prompt.js';

const { el } = ui;

export default class Guide extends Feature {
  start() {
    this.add('views', {
      id: 'guide', label: 'Guide', icon: 'help', order: 20,
      subtitle: () => 'The Chords format',
      mount: (container) => {
        this.box = el('div', { class: 'guide' });
        container.append(this.box);
      },
      render: () => this.draw(),
    });
  }

  draw() {
    if (this.drawn) return; // nothing on this page changes
    this.drawn = true;
    const song = el('input', { type: 'text', placeholder: 'Song and artist', 'aria-label': 'Song and artist' });
    const songs = this.use('songs');
    const chart = this.use('chart');
    let showSource = false;
    const example = el('div', { class: 'guide-example' });
    const drawExample = () => example.replaceChildren(
      showSource || !chart ? el('pre', { class: 'guide-code' }, EXAMPLE) : chart.render(EXAMPLE));
    drawExample();

    this.box.replaceChildren(
      el('section', { class: 'panel guide-claude' },
        el('h2', {}, 'Get a chart from Claude'),
        el('ol', { class: 'guide-steps' },
          el('li', {}, 'Type the song (or several, with commas).'),
          el('li', {}, 'Copy the prompt and paste it into Claude.'),
          el('li', {}, 'Copy Claude\'s answer, then add it here with Paste.')),
        song,
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn primary', onclick: () => this.copy(promptFor(song.value)) }, 'Copy the prompt'),
          songs ? el('button', { type: 'button', class: 'btn', onclick: () => songs.import() }, 'Paste the answer') : null),
        el('details', { class: 'advanced' },
          el('summary', {}, 'See the prompt'),
          el('pre', { class: 'guide-code' }, promptFor('')))),
      el('section', { class: 'panel' },
        el('h2', {}, 'Quick reference'),
        el('pre', { class: 'guide-code', 'data-own-swipe': true }, QUICK_REFERENCE),
        ui.hint('The whole format, with every rule and example, is in docs/FORMAT.md in the app\'s GitHub repository.', { small: true })),
      el('section', { class: 'panel' },
        el('div', { class: 'guide-example-head' },
          el('h2', {}, 'Example'),
          chart ? el('button', { type: 'button', class: 'btn small', onclick: (e) => {
            showSource = !showSource;
            e.target.textContent = showSource ? 'Show the chart' : 'Show the text';
            drawExample();
          } }, 'Show the text') : null),
        example));
  }

  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast('Copied. Paste it into Claude.');
    } catch {
      // No clipboard here: show it so it can be selected and copied by hand.
      const d = ui.dialog({ title: 'The prompt', onClose: () => d.element.remove() });
      d.setContent(ui.hint('Press and hold to select it all, then Copy.'), el('textarea', { class: 'guide-copy', rows: '16', readonly: true }, text));
      d.open();
    }
  }
}
