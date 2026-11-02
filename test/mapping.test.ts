import { describe, it, expect } from 'vitest';
import { mapHandToSynth, SCALE_LENGTH } from '../src/mapping/handToSynth';
import { EMPTY_HAND } from '../src/hands/types';

describe('mapHandToSynth', () => {
  it('mutes when no hand is present', () => {
    expect(mapHandToSynth(EMPTY_HAND).mute).toBe(true);
  });

  it('maps index.x across the scale', () => {
    const left = mapHandToSynth({ ...EMPTY_HAND, present: true, index: { x: 0, y: 0.5 } });
    const right = mapHandToSynth({ ...EMPTY_HAND, present: true, index: { x: 0.999, y: 0.5 } });
    expect(left.noteIndex).toBe(0);
    expect(right.noteIndex).toBe(SCALE_LENGTH - 1);
  });

  it('closed fist mutes', () => {
    const p = mapHandToSynth({ ...EMPTY_HAND, present: true, index: { x: 0.5, y: 0.5 }, gesture: 'Closed_Fist' });
    expect(p.mute).toBe(true);
  });
});
