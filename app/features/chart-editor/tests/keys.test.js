import { test, assert } from 'folio/testing';
import { insertAt, QUICK_KEYS } from '../keys.js';

test('inserts where the cursor is', () => {
  assert.deepEqual(insertAt('| C |', 2, 3, 'G'), { value: '| G |', cursor: 3 });
});

test('brackets leave the cursor inside', () => {
  const split = QUICK_KEYS.find((k) => k.label === '[ ]');
  assert.deepEqual(insertAt('| C . |', 4, 4, split), { value: '| C [ ]. |', cursor: 5 });
});
