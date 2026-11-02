/**
 * No-webcam fallback: three sliders + a mute toggle that emit the same HandState
 * the tracker would. Lets the demo work on phones and lets you test the mapping without a camera.
 *
 * TODO (milestone 1): build the controls inside `root` and emit HandState on input.
 */
import type { HandState } from '../hands/types';
import { EMPTY_HAND } from '../hands/types';
import type { HandSource } from '../hands/tracker';

export function createSliderFallback(root: HTMLElement): HandSource {
  let cb: ((s: HandState) => void) | null = null;
  root.innerHTML = `<p class="hint">No webcam — use the sliders.</p>`; // TODO add inputs
  void EMPTY_HAND;
  return {
    onState(fn) { cb = fn; },
    stop() { cb = null; }
  };
}
