/**
 * gibber-hands — entry point.
 *
 * Wiring only. Each module below owns one concern and exposes a tiny interface;
 * keep this file free of logic so the data flow stays readable:
 *
 *   webcam frame ──► hands/tracker ──► HandState ──► mapping ──► SynthParams ──► synth/engine
 *                                        │                          │ note lane       │
 *                                        └──► ui/overlay ◄──────────┘                 └──► ui/liveCode (Gibber code shown live)
 *                                             (landmarks, gesture label, note lanes)
 *
 * The "no camera" path uses ui/sliders to produce the same HandState shape,
 * so everything downstream of HandState works identically on a phone.
 */
import { createStartup } from './hands/startup';
import { EMPTY_HAND } from './hands/types';
import { mapHandToSynth, type SynthParams } from './mapping/handToSynth';
import { createSynth } from './synth/engine';
import { gibberSnippet } from './synth/snippet';
import { createAudioPanel } from './ui/audioPanel';
import { createLayout } from './ui/layout';
import { createCameraPanel } from './ui/cameraPanel';
import { createOverlay } from './ui/overlay';
import { createSliderFallback, type SliderFallback } from './ui/sliders';
import { throttle } from './ui/throttle';

/** The live code panel updates at most this often, in ms. */
const LIVE_CODE_PERIOD_MS = 100;

function boot() {
  const ui = createLayout(document.getElementById('app')!);
  // Camera and hand model start first, so the prompt and the download begin as the page loads.
  let sliders: SliderFallback | null = null;
  const startup = createStartup(ui.camera.video, () => (sliders = createSliderFallback(ui.camera.status)));
  const panel = createCameraPanel(ui.camera.status, startup);
  const overlay = createOverlay(ui.camera.root, ui.camera.video, ui.camera.canvas);
  startup.onStatus((status) => {
    panel.show(status);
    overlay.setVisible(status.tracking);
  });

  const synth = createSynth();
  const audio = createAudioPanel(ui.instrument, synth);
  synth.onStatus(audio.show);
  const showCode = throttle((p: SynthParams) => ui.liveCode.show(gibberSnippet(p)), LIVE_CODE_PERIOD_MS);
  // Hand states start only once tracking or the sliders run: until then, show the silent sound.
  showCode(mapHandToSynth(EMPTY_HAND, null));
  // The only hand listener: a second onHand() call would replace this one.
  let sound: SynthParams | null = null;
  startup.onHand((s, landmarks) => {
    sound = mapHandToSynth(s, sound);
    overlay.draw(s, landmarks, sound.lane);
    sliders?.showNote(sound.lane);
    synth.update(sound);
    showCode(sound);
  });
}

try {
  boot();
} catch (e) {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
}
