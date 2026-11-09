import { test, assert } from 'folio/testing';
import { promptFor, PROMPT, QUICK_REFERENCE } from '../prompt.js';

test('the prompt names the song, or leaves a gap for it', () => {
  assert.match(promptFor('Harbour Lights by The Example Band'), /for: Harbour Lights by The Example Band/);
  assert.match(promptFor(''), /\[song name and artist\]/);
});

test('the prompt carries the quick reference and an example', () => {
  assert.ok(PROMPT.includes(QUICK_REFERENCE));
  assert.match(PROMPT, /\[Verse\]/);
});
