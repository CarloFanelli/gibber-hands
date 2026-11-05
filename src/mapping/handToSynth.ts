/**
 * Pure function: HandState → SynthParams, the sound the hand asks for. No DOM, no audio, no MediaPipe.
 * This is the file that gets unit-tested (see test/mapping.test.ts).
 *
 * The palm center plays across the playing zone: left–right picks one of 8 note lanes, height sets the
 * brightness. Squeeze to play: thumb and index touching is full volume, fingers apart is silence, so a
 * relaxed hand is quiet. A closed fist and a lost hand fade to silence.
 */
import type { HandState, Point } from '../hands/types';

/** The playing zone: the central 80% of the view, across and down. Outside it, values stay at its edge. */
export const PLAYING_ZONE = { start: 0.1, end: 0.9 };
/** A minor pentatonic, one note per lane from left to right, in equal temperament from A4 = 440 Hz. */
export const NOTE_LANES = (
  [['A3', -12], ['C4', -9], ['D4', -7], ['E4', -5], ['G4', -2], ['A4', 0], ['C5', 3], ['D5', 5]] as const
).map(([name, semitonesFromA4]) => ({ name, frequency: 440 * 2 ** (semitonesFromA4 / 12) }));

const LANE_WIDTH = (PLAYING_ZONE.end - PLAYING_ZONE.start) / NOTE_LANES.length;
/** The note changes only once the palm center is this far past a lane border, in lanes. Tuned by ear. */
const LANE_HYSTERESIS = 0.2;
/** Filter cutoff at the bottom and at the top of the playing zone, Hz. */
const CUTOFF = { bottom: 200, top: 6400 };
/** Pinch at or below this is full volume. Tuned by ear. */
const PINCH_FULL = 0.2;
/** Pinch at or above this is silence. Tuned by ear. */
const PINCH_SILENT = 0.5;
/** How long the volume takes to reach a new target, in ms. Tuned by ear. */
const RAMP_MS = { pinch: 15, fist: 30, lost: 100 };

export interface SynthParams {
  /** The note lane played, 0..7 from the left; null while no hand is in view. */
  lane: number | null;
  /** Oscillator pitch, Hz. */
  frequency: number;
  /** Low-pass filter cutoff, Hz. */
  cutoff: number;
  /** Volume, 0..1 of full. */
  amp: number;
  /** Time for the volume to reach `amp`, ms. */
  ampRampMs: number;
}

/** `previous` is what the last HandState asked for (null at first), which the note lane sticks to. */
export function mapHandToSynth(s: HandState, previous: SynthParams | null): SynthParams {
  if (!s.present) {
    // The note and the brightness stay while the sound fades. The lane is forgotten: the next hand
    // plays the lane under its palm center.
    const { frequency, cutoff } = previous ?? soundAt(s.palm, null);
    return { lane: null, frequency, cutoff, amp: 0, ampRampMs: RAMP_MS.lost };
  }
  const sound = soundAt(s.palm, previous?.lane ?? null);
  if (s.gesture === 'Closed_Fist') return { ...sound, amp: 0, ampRampMs: RAMP_MS.fist };
  return { ...sound, amp: squeezeVolume(s.pinch), ampRampMs: RAMP_MS.pinch };
}

function soundAt(palm: Point, currentLane: number | null) {
  const lane = noteLane(palm.x, currentLane);
  return { lane, frequency: NOTE_LANES[lane]!.frequency, cutoff: brightness(palm.y) };
}

/** The note lane under `x`, except that the current lane holds until `x` is LANE_HYSTERESIS past its borders. */
function noteLane(x: number, current: number | null): number {
  const position = (x - PLAYING_ZONE.start) / LANE_WIDTH;
  if (current !== null && position >= current - LANE_HYSTERESIS && position <= current + 1 + LANE_HYSTERESIS) {
    return current;
  }
  // A palm center exactly on a border plays the lane to its right: the tiny margin absorbs the rounding
  // of the division, which puts 0.3 a hair short of its border.
  return Math.min(NOTE_LANES.length - 1, Math.max(0, Math.floor(position + 1e-9)));
}

/** Exponential, so equal moves of the palm sound like equal changes of brightness. */
function brightness(y: number): number {
  const height = clamp01((PLAYING_ZONE.end - y) / (PLAYING_ZONE.end - PLAYING_ZONE.start));
  return CUTOFF.bottom * (CUTOFF.top / CUTOFF.bottom) ** height;
}

/** 0 with the fingers apart, 1 with them touching, growing with the square of how far they have closed. */
function squeezeVolume(pinch: number): number {
  const closed = clamp01((PINCH_SILENT - pinch) / (PINCH_SILENT - PINCH_FULL));
  return closed * closed;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
