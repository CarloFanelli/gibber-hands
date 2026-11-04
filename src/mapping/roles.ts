/**
 * Which hand leads: the lead hand always plays notes, the second hand plays them too or shapes the sound.
 * The right hand leads unless the player chose the left; hands keep their sides, only the roles swap.
 */
import type { HandPair, Side, TrackedHand } from '../hands/types';

/** The lead side from its stored value: the left hand only when "left" was saved. */
export function leadSide(stored: string | null): Side {
  return stored === 'left' ? 'left' : 'right';
}

function otherSide(side: Side): Side {
  return side === 'right' ? 'left' : 'right';
}

export function roles(pair: HandPair, lead: Side): { lead: TrackedHand; second: TrackedHand } {
  return { lead: pair[lead], second: pair[otherSide(lead)] };
}
