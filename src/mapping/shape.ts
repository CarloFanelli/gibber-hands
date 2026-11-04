/**
 * The second hand's shape mode. A Victory sign by the second hand switches it between playing notes and
 * shape mode, once per sign; it starts every visit playing notes. In shape mode it plays no note, and
 * holding its squeeze closed raises every note one octave.
 */
import type { GestureName, HandState } from '../hands/types';
import { PINCH_FULL } from './handToSynth';

/** Once raised, the octave drops only when the pinch opens past this, so a squeeze hovering at the full-volume level never flickers. Tuned by ear. */
const OCTAVE_RELEASE = 0.3;

export interface SecondHand {
  mode: 'notes' | 'shape';
  /** The gesture it showed last time, null without a hand: a sign counts when it first appears. */
  lastGesture: GestureName | null;
}

export const SECOND_HAND_START: SecondHand = { mode: 'notes', lastGesture: null };

/** The second hand's mode after this frame. */
export function followSecondHand(previous: SecondHand, hand: HandState): SecondHand {
  const gesture = hand.present ? hand.gesture : null;
  const sign = gesture === 'Victory' && previous.lastGesture !== 'Victory';
  const mode = sign ? (previous.mode === 'notes' ? 'shape' : 'notes') : previous.mode;
  return { mode, lastGesture: gesture };
}

/** Whether the octave is raised after this frame, given whether it was. A closed fist is no squeeze. */
export function octaveRaised(raised: boolean, hand: HandState, second: SecondHand): boolean {
  if (second.mode !== 'shape' || !hand.present || hand.gesture === 'Closed_Fist') return false;
  return hand.pinch <= (raised ? OCTAVE_RELEASE : PINCH_FULL);
}

/** The second hand as the mapping plays it: in shape mode as a lost hand, so its note fades as one does. */
export function asPlayed(hand: HandState, second: SecondHand): HandState {
  return second.mode === 'shape' ? { ...hand, present: false } : hand;
}

/** The new second hand after the roles swap: playing notes, and a Victory sign it already shows doesn't count. */
export function secondHandAfterSwap(hand: HandState): SecondHand {
  return { mode: 'notes', lastGesture: hand.present ? hand.gesture : null };
}
