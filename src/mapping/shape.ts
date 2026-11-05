/**
 * The second hand's modes. A Victory sign by the second hand switches it between playing notes and shape
 * mode, once per sign. It starts every visit playing notes. In shape mode it plays no note, holding its
 * squeeze closed raises every note one octave, holding a thumbs-down lowers them one, and its height sets
 * the reverb or echo amount.
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
  const switches = gesture === 'Victory' && gesture !== previous.lastGesture;
  const mode = switches ? (previous.mode === 'shape' ? 'notes' : 'shape') : previous.mode;
  return { mode, lastGesture: gesture };
}

/** Octaves every note is played from the preset's own: lowered, normal or raised. */
export type Octave = -1 | 0 | 1;

/**
 * The octave after this frame, given the one before. A thumbs-down wins over a squeeze, so a squeeze
 * straight into one drops two octaves at once. A closed fist is no squeeze.
 */
export function octaveShift(previous: Octave, hand: HandState, second: SecondHand): Octave {
  if (second.mode !== 'shape' || !hand.present || hand.gesture === 'Closed_Fist') return 0;
  if (hand.gesture === 'Thumb_Down') return -1;
  return hand.pinch <= (previous === 1 ? OCTAVE_RELEASE : PINCH_FULL) ? 1 : 0;
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
  return second.mode === 'notes' ? hand : { ...hand, present: false };
}

/** The new second hand after the roles swap: playing notes, and a sign it already shows doesn't count. */
export function secondHandAfterSwap(hand: HandState): SecondHand {
  return { mode: 'notes', lastGesture: hand.present ? hand.gesture : null };
}
