import { describe, expect, it } from 'vitest';
import { clampShare, savedShare } from '../src/ui/codeGuideSplit';

describe('savedShare', () => {
  it('reads the code’s saved share of the panel', () => {
    expect(savedShare('0.3')).toBe(0.3);
    expect(savedShare('1')).toBe(1);
  });

  it('is half and half on a first visit, with storage blocked, or with an unreadable value', () => {
    for (const stored of [null, '', ' ', 'abc', '0.4px', 'NaN', 'Infinity', '-0.1', '1.5']) expect(savedShare(stored)).toBe(0.5);
  });
});

describe('clampShare', () => {
  it('keeps a share that leaves each part 120 px or more', () => {
    expect(clampShare(0.3, 800)).toBe(0.3);
  });

  it('stops where the code reaches 120 px', () => {
    expect(clampShare(0.05, 800)).toBeCloseTo(120 / 800, 9);
  });

  it('stops where the guide reaches 120 px', () => {
    expect(clampShare(0.99, 800)).toBeCloseTo(680 / 800, 9);
  });

  it('is half and half in a panel shorter than 240 px', () => {
    expect(clampShare(0.2, 239)).toBe(0.5);
    expect(clampShare(0.2, 240)).toBe(0.5);
  });
});
