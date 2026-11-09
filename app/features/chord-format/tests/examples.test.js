import { test, assert } from 'folio/testing';
import { parseFile } from '../parse.js';
import { EXAMPLES } from '../examples.js';

test('the example songs read without a single problem', () => {
  for (const example of EXAMPLES) {
    const songs = parseFile(example.text);
    assert.equal(songs.length, 1);
    assert.deepEqual(songs[0].problems, []);
    assert.ok(songs[0].title);
  }
});
