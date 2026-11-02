/**
 * Pure function: HandState → SynthParams, the sound the hand asks for. No DOM, no audio, no MediaPipe.
 * This is the file that gets unit-tested (see test/mapping.test.ts).
 *
 * Squeeze to play: thumb and index touching is full volume, fingers apart is silence, so a relaxed
 * hand is quiet. A closed fist and a lost hand fade to silence.
 */
import type { HandState } from '../hands/types';

/** Pinch at or below this is full volume. Tuned by ear. */
const PINCH_FULL = 0.2;
/** Pinch at or above this is silence. Tuned by ear. */
const PINCH_SILENT = 0.5;
/** How long the volume takes to reach a new target, in ms. Tuned by ear. */
const RAMP_MS = { pinch: 15, fist: 30, lost: 100 };
/** Note (A4) and brightness played until the palm center moves them. */
const START_FREQUENCY = 440;
const START_CUTOFF = 1131;

export interface SynthParams {
  /** Oscillator pitch, Hz. */
  frequency: number;
  /** Low-pass filter cutoff, Hz. */
  cutoff: number;
  /** Volume, 0..1 of full. */
  amp: number;
  /** Time for the volume to reach `amp`, ms. */
  ampRampMs: number;
}

export function mapHandToSynth(s: HandState): SynthParams {
  const sound = { frequency: START_FREQUENCY, cutoff: START_CUTOFF };
  if (!s.present) return { ...sound, amp: 0, ampRampMs: RAMP_MS.lost };
  if (s.gesture === 'Closed_Fist') return { ...sound, amp: 0, ampRampMs: RAMP_MS.fist };
  return { ...sound, amp: squeezeVolume(s.pinch), ampRampMs: RAMP_MS.pinch };
}

/** 0 with the fingers apart, 1 with them touching, growing with the square of how far they have closed. */
function squeezeVolume(pinch: number): number {
  const closed = Math.min(1, Math.max(0, (PINCH_SILENT - pinch) / (PINCH_SILENT - PINCH_FULL)));
  return closed * closed;
}
