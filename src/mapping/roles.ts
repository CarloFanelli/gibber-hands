/**
 * Which hand leads: the lead hand always plays notes, the second hand plays them too or shapes the sound.
 * The right hand leads unless the player chose the left; hands keep their sides, only the roles swap.
 */
import type { Side } from '../hands/types';

/** The lead side from its stored value: the left hand only when "left" was saved. */
export function leadSide(stored: string | null): Side {
  return stored === 'left' ? 'left' : 'right';
}

export function otherSide(side: Side): Side {
  return side === 'right' ? 'left' : 'right';
}

/** Splits anything kept by side, hands or their sounds, into the lead hand's and the second hand's. */
export function roles<T>(bySide: Record<Side, T>, lead: Side): { lead: T; second: T } {
  return { lead: bySide[lead], second: bySide[otherSide(lead)] };
}
