/**
 * Pure function: HandState → SynthParams. No DOM, no audio, no MediaPipe.
 * This is the file that gets unit-tested (see test/mapping.test.ts).
 *
 * Proposed first mapping (adjust after playing with it, document changes in docs/PROCESS.md):
 *  - index.x (0..1)          → note index within the current scale (quantized)
 *  - index.y (0..1, top=0)   → filter cutoff, exponential, top = bright
 *  - pinch (0..1)            → amplitude: pinched = loud, open = quiet
 *  - gesture 'Closed_Fist'   → mute
 *  - gesture 'Open_Palm'     → sustain / hold current note
 *  - pinchMiddle             → reverb/delay mix (secondary control)
 */
import type { HandState } from '../hands/types';

export interface SynthParams {
  noteIndex: number;   // integer, index in the active scale
  cutoff: number;      // 0..1
  amp: number;         // 0..1
  fx: number;          // 0..1
  mute: boolean;
  hold: boolean;
}

export const SCALE_LENGTH = 8;

export function mapHandToSynth(s: HandState): SynthParams {
  if (!s.present || !s.index) {
    return { noteIndex: 0, cutoff: 0.5, amp: 0, fx: 0, mute: true, hold: false };
  }
  // TODO (milestone 2): implement the mapping above, with clamping and quantization.
  return {
    noteIndex: Math.min(SCALE_LENGTH - 1, Math.floor(s.index.x * SCALE_LENGTH)),
    cutoff: 1 - s.index.y,
    amp: 1 - s.pinch,
    fx: 1 - s.pinchMiddle,
    mute: s.gesture === 'Closed_Fist',
    hold: s.gesture === 'Open_Palm'
  };
}
