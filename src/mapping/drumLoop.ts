/**
 * The drum loop's state for the visit: whether it plays, which drum pattern with how many drum layers, and
 * whether the second hand's closed fist mutes it. A reload starts with the drums stopped.
 */
import type { HandState } from '../hands/types';
import type { EngineStatus } from '../synth/engine';
import { DRUM_PATTERNS, type DrumLayers, type Drums } from '../synth/drumPatterns';
import { zoneColumn, zoneRow } from './handToSynth';
import type { SecondHand } from './shape';

export interface DrumLoop extends Drums {
  playing: boolean;
  /** Silent while its time runs on, so the drums come back in time. */
  muted: boolean;
}

/** Stopped; a first loop of the visit plays Rock with all 4 drum layers. */
export const DRUMS_START: DrumLoop = { playing: false, pattern: 0, layers: 4, muted: false };

/** Starts or stops the loop: "Start drums", "Stop drums" or the D key. A start resumes the last pattern and layers, unmuted. */
export function toggleDrums(loop: DrumLoop): DrumLoop {
  return { ...loop, playing: !loop.playing, muted: false };
}

/** Starts the loop if it isn't playing, as the second hand switches to drum mode; a playing loop goes on. */
export function startDrums(loop: DrumLoop): DrumLoop {
  return loop.playing ? loop : { ...loop, playing: true };
}

/**
 * The loop as the second hand in drum mode steers it: its palm center picks the drum pattern, the four side
 * by side across the playing zone, and its height the drum layers, 1 in the bottom row to 4 in the top one.
 * Out of view, it leaves the loop as it is.
 */
export function steerDrums(loop: DrumLoop, hand: HandState): DrumLoop {
  if (!hand.present) return loop;
  const pattern = zoneColumn(hand.palm.x, loop.pattern, DRUM_PATTERNS.length);
  const layers = (zoneRow(hand.palm.y, loop.layers - 1, 4) + 1) as DrumLayers;
  return pattern === loop.pattern && layers === loop.layers ? loop : { ...loop, pattern, layers };
}

/**
 * The loop muted while audio is on and the second hand, in view and in drum mode, closes its fist; anything
 * else ends the mute. A squeeze is no fist.
 */
export function muteDrums(loop: DrumLoop, hand: HandState, second: SecondHand, engine: EngineStatus): DrumLoop {
  const muted = loop.playing && engine.kind === 'on' && second.mode === 'drums' && hand.present && hand.gesture === 'Closed_Fist';
  return muted === loop.muted ? loop : { ...loop, muted };
}

/**
 * The loop once the audio engine reports `engine`: a failed engine can't play it, so it stops. Audio off
 * keeps it, silent and unmuted, so "Start audio" brings the drums back.
 */
export function drumsWithEngine(loop: DrumLoop, engine: EngineStatus): DrumLoop {
  if (engine.kind === 'failed' && loop.playing) return { ...loop, playing: false, muted: false };
  return engine.kind !== 'on' && loop.muted ? { ...loop, muted: false } : loop;
}
