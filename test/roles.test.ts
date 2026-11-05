import { describe, expect, it } from 'vitest';
import { EMPTY_HAND, emptyPair, type HandPair } from '../src/hands/types';
import { leadSide, roles } from '../src/mapping/roles';

describe('lead side', () => {
  it('is the right hand unless the left was chosen', () => {
    expect(leadSide('left')).toBe('left');
    expect(leadSide('right')).toBe('right');
  });

  it('is the right hand when nothing was saved or the saved value is unreadable', () => {
    expect(leadSide(null)).toBe('right');
    expect(leadSide('LEFT ')).toBe('right');
    expect(leadSide('')).toBe('right');
  });
});

describe('roles', () => {
  const pair: HandPair = {
    right: { state: { ...EMPTY_HAND, present: true, palm: { x: 0.8, y: 0.5 } }, landmarks: [] },
    left: { state: { ...EMPTY_HAND, present: true, palm: { x: 0.2, y: 0.5 } }, landmarks: null }
  };

  it('makes the right hand the lead hand and the left the second hand', () => {
    expect(roles(pair, 'right')).toEqual({ lead: pair.right, second: pair.left });
  });

  it('reverses them when the left hand leads', () => {
    expect(roles(pair, 'left')).toEqual({ lead: pair.left, second: pair.right });
  });

  it('gives empty hands for an empty pair', () => {
    const { lead, second } = roles(emptyPair(5), 'right');
    expect([lead.state.present, second.state.present, lead.state.t, second.state.t]).toEqual([false, false, 5, 5]);
  });
});
