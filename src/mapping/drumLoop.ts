/**
 * The drum loop's state for the visit: whether it plays, and which drum pattern with how many drum layers.
 * A reload starts with the drums stopped.
 */
import type { EngineStatus } from '../synth/engine';
import type { Drums } from '../synth/drumPatterns';

export interface DrumLoop extends Drums {
  playing: boolean;
}

/** Stopped; a first loop of the visit plays Rock with all 4 drum layers. */
export const DRUMS_START: DrumLoop = { playing: false, pattern: 0, layers: 4 };

/** Starts or stops the loop: "Start drums", "Stop drums" or the D key. A start resumes the last pattern and layers. */
export function toggleDrums(loop: DrumLoop): DrumLoop {
  return { ...loop, playing: !loop.playing };
}

/**
 * The loop once the audio engine reports `engine`: a failed engine can't play it, so it stops. Audio off
 * keeps it, silent, so "Start audio" brings it back.
 */
export function drumsWithEngine(loop: DrumLoop, engine: EngineStatus): DrumLoop {
  return engine.kind === 'failed' && loop.playing ? { ...loop, playing: false } : loop;
}
