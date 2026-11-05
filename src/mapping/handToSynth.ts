/**
 * Pure function: HandState → SynthParams, the sound the hand asks for. No DOM, no audio, no MediaPipe.
 * This is the file that gets unit-tested (see test/mapping.test.ts).
 *
 * The palm center plays across the playing zone: left–right picks one of 8 note lanes, each playing a note
 * of the current preset, and height sets the brightness. Squeeze to play: thumb and index touching is
 * full volume, fingers apart is silence, so a relaxed hand is quiet. A closed fist and a lost hand fade to
 * silence. With the octave raised, every note and its brightness double.
 */
import type { HandState, Point } from '../hands/types';

/** The playing zone: the central 80% of the view, across and down. Outside it, values stay at its edge. */
export const PLAYING_ZONE = { start: 0.1, end: 0.9 };
/** The playing zone is divided into this many note lanes, from left to right. */
export const LANE_COUNT = 8;
const LANE_WIDTH = (PLAYING_ZONE.end - PLAYING_ZONE.start) / LANE_COUNT;
/** The note changes only once the palm center is this far past a lane border, in lanes. Tuned by ear. */
const LANE_HYSTERESIS = 0.2;
/** Filter cutoff at the bottom and at the top of the playing zone, Hz. */
const CUTOFF = { bottom: 200, top: 6400 };
/** Pinch at or below this is full volume. Tuned by ear. */
export const PINCH_FULL = 0.2;
/** Pinch at or above this is silence. Tuned by ear. */
const PINCH_SILENT = 0.5;
/** How long the volume takes to reach a new target, in ms. Tuned by ear. */
const RAMP_MS = { pinch: 15, fist: 30, lost: 100 };

/** The note a lane plays. */
export interface Note {
  name: string;
  frequency: number;
}

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
  /** Octaves above the preset's notes: 1 while the octave is raised, else 0. */
  octave: number;
}

/**
 * `previous` is what the last HandState asked for (null at first), which the note lane sticks to. `lanes`
 * are the current preset's notes, one per note lane; `octave` is 1 while the octave is raised.
 */
export function mapHandToSynth(s: HandState, previous: SynthParams | null, lanes: readonly Note[], octave = 0): SynthParams {
  const scale = 2 ** octave;
  if (!s.present) {
    // The note and the brightness stay while the sound fades, in the octave being played. After a preset
    // switch the old note may not be one of the new preset's: the lane under the palm center gives one.
    // The lane is forgotten: the next hand plays the lane under its palm center.
    const here = soundAt(s.palm, null, lanes, scale);
    const silent = { lane: null, amp: 0, ampRampMs: RAMP_MS.lost, octave };
    if (!previous) return { ...silent, frequency: here.frequency, cutoff: here.cutoff };
    const shift = scale / 2 ** previous.octave;
    const note = previous.frequency / 2 ** previous.octave;
    const frequency = lanes.some((n) => n.frequency === note) ? previous.frequency * shift : here.frequency;
    return { ...silent, frequency, cutoff: previous.cutoff * shift };
  }
  const sound = soundAt(s.palm, previous?.lane ?? null, lanes, scale);
  if (s.gesture === 'Closed_Fist') return { ...sound, amp: 0, ampRampMs: RAMP_MS.fist, octave };
  return { ...sound, amp: squeezeVolume(s.pinch), ampRampMs: RAMP_MS.pinch, octave };
}

function soundAt(palm: Point, currentLane: number | null, lanes: readonly Note[], scale: number) {
  const lane = noteLane(palm.x, currentLane);
  return { lane, frequency: lanes[lane]!.frequency * scale, cutoff: brightness(palm.y) * scale };
}

/** The note lane under `x`, except that the current lane holds until `x` is LANE_HYSTERESIS past its borders. */
function noteLane(x: number, current: number | null): number {
  const position = (x - PLAYING_ZONE.start) / LANE_WIDTH;
  if (current !== null && position >= current - LANE_HYSTERESIS && position <= current + 1 + LANE_HYSTERESIS) {
    return current;
  }
  // A palm center exactly on a border plays the lane to its right: the tiny margin absorbs the rounding
  // of the division, which puts 0.3 a hair short of its border.
  return Math.min(LANE_COUNT - 1, Math.max(0, Math.floor(position + 1e-9)));
}

/** Exponential, so equal moves of the palm sound like equal changes of brightness. */
function brightness(y: number): number {
  return CUTOFF.bottom * (CUTOFF.top / CUTOFF.bottom) ** zoneHeight(y);
}

/** How high `y` is in the playing zone: 0 at its bottom, 1 at its top, and held there outside it. */
export function zoneHeight(y: number): number {
  return clamp01((PLAYING_ZONE.end - y) / (PLAYING_ZONE.end - PLAYING_ZONE.start));
}

/** 0 with the fingers apart, 1 with them touching, growing with the square of how far they have closed. */
function squeezeVolume(pinch: number): number {
  const closed = clamp01((PINCH_SILENT - pinch) / (PINCH_SILENT - PINCH_FULL));
  return closed * closed;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
