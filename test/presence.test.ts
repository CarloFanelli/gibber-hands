import { describe, expect, it } from 'vitest';
import { createPresence } from '../src/hands/presence';

const FRAME = 33;

describe('presence', () => {
  it('is gone from the first frame when no hand was ever seen', () => {
    expect(createPresence().update(null, 0)).toBe('gone');
  });

  it('holds a hand missing for under 150 ms, with no gap when it returns', () => {
    const p = createPresence();
    expect(p.update('Right', 0)).toBe('new');
    expect(p.update(null, 33)).toBe('held');
    expect(p.update(null, 100)).toBe('held');
    expect(p.update('Right', 133)).toBe('tracked');
  });

  it('turns false exactly when the hand has been missing for 150 ms', () => {
    const p = createPresence();
    p.update('Right', 0);
    for (let t = FRAME; t < 150; t += FRAME) expect(p.update(null, t)).toBe('held');
    expect(p.update(null, 150)).toBe('gone');
  });

  it('starts over as a new hand after it was gone', () => {
    const p = createPresence();
    p.update('Right', 0);
    p.update(null, 150);
    expect(p.update('Right', 183)).toBe('new');
  });

  it('follows one hand and ignores another until the followed one is gone', () => {
    const p = createPresence();
    p.update('Right', 0);
    expect(p.update('Left', 33)).toBe('held');
    expect(p.update('Left', 133)).toBe('held');
    expect(p.update('Left', 150)).toBe('gone');
    expect(p.update('Left', 183)).toBe('new');
  });

  it('restarts when frames are more than 150 ms apart, as after a background tab', () => {
    const p = createPresence();
    p.update('Right', 0);
    expect(p.update('Right', 1000)).toBe('new');
  });

  it('forgets the hand on reset', () => {
    const p = createPresence();
    p.update('Right', 0);
    p.reset();
    expect(p.update(null, 33)).toBe('gone');
    expect(p.update('Right', 66)).toBe('new');
  });
});
