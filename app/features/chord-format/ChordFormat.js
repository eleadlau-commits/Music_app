// Chords format: the reader for .chords files, offered to other features as the `chords`
// service. It shows nothing itself. The rules are in parse.js and theory.js; the format is
// described in docs/FORMAT.md.
//
// Saved data: none.

import { Feature } from 'folio';
import { parseFile, parseSong, tokenize, BUILT_IN_MARKS, FORMAT_VERSION } from './parse.js';
import { parseChord, parseKey, displayChord, transposeKey, transposeSymbol } from './theory.js';
import { EXAMPLES } from './examples.js';

export default class ChordFormat extends Feature {
  start() {
    this.provide('chords', {
      version: FORMAT_VERSION,
      parseFile,
      parseSong,
      tokenize,
      marks: BUILT_IN_MARKS,
      parseChord,
      parseKey,
      displayChord,
      transposeKey,
      transposeSymbol,
      examples: EXAMPLES,
    });
  }
}
