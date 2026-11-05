/**
 * The drum loop's state for the visit: whether it plays, and which drum pattern with how many drum layers.
 * A reload starts with the drums stopped.
 */
import type { HandState } from '../hands/types';
import type { EngineStatus } from '../synth/engine';
import { DRUM_PATTERNS, type DrumLayers, type Drums } from '../synth/drumPatterns';
import { zoneColumn, zoneRow } from './handToSynth';

export interface DrumLoop extends Drums {
  playing: boolean;
}

/** Stopped; a first loop of the visit plays Rock with all 4 drum layers. */
export const DRUMS_START: DrumLoop = { playing: false, pattern: 0, layers: 4 };

/** Starts or stops the loop: "Start drums", "Stop drums" or the D key. A start resumes the last pattern and layers. */
export function toggleDrums(loop: DrumLoop): DrumLoop {
  return { ...loop, playing: !loop.playing };
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
 * The loop once the audio engine reports `engine`: a failed engine can't play it, so it stops. Audio off
 * keeps it, silent, so "Start audio" brings it back.
 */
export function drumsWithEngine(loop: DrumLoop, engine: EngineStatus): DrumLoop {
  return engine.kind === 'failed' && loop.playing ? { ...loop, playing: false } : loop;
}
