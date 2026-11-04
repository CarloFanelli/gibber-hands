/**
 * The second hand's shape mode. A Victory sign by the second hand switches it between playing notes and
 * shape mode, once per sign; it starts every visit playing notes. In shape mode it plays no note, holding
 * its squeeze closed raises every note one octave, and its height sets the reverb or echo amount.
 */
import type { GestureName, HandState } from '../hands/types';
import { PINCH_FULL, zoneHeight } from './handToSynth';

/** Once raised, the octave drops only when the pinch opens past this, so a squeeze hovering at the full-volume level never flickers. Tuned by ear. */
const OCTAVE_RELEASE = 0.3;
/** The most reverb or echo the shaping hand can ask for, as a share of the output. */
const MAX_EFFECT = 0.8;

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

/**
 * The reverb or echo amount, 0..1, given the preset's own `mix`. In shape mode the second hand's height
 * sets it: none at the bottom of the playing zone, `mix` at the middle and double at the top, at most
 * MAX_EFFECT, straight between those three. Otherwise it is `mix`.
 */
export function effectAmount(hand: HandState, second: SecondHand, mix: number): number {
  if (second.mode !== 'shape' || !hand.present) return mix;
  const height = zoneHeight(hand.palm.y);
  if (height <= 0.5) return mix * height * 2;
  const top = Math.min(2 * mix, MAX_EFFECT);
  return mix + (top - mix) * (height - 0.5) * 2;
}

/** The second hand as the mapping plays it: in shape mode as a lost hand, so its note fades as one does. */
export function asPlayed(hand: HandState, second: SecondHand): HandState {
  return second.mode === 'shape' ? { ...hand, present: false } : hand;
}

/** The new second hand after the roles swap: playing notes, and a Victory sign it already shows doesn't count. */
export function secondHandAfterSwap(hand: HandState): SecondHand {
  return { mode: 'notes', lastGesture: hand.present ? hand.gesture : null };
}
