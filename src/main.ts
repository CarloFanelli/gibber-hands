/**
 * gibber-hands — entry point.
 *
 * Wiring only. Each module below owns one concern and exposes a tiny interface;
 * keep this file free of logic so the data flow stays readable:
 *
 *   webcam frame ──► hands/tracker ──► HandState ──► mapping ──► SynthParams ──► synth/engine
 *                                        │                                            │
 *                                        └──► ui/overlay (landmarks, gesture label)   └──► ui/liveCode (Gibber code shown live)
 *
 * The "no camera" path uses ui/sliders to produce the same HandState shape,
 * so everything downstream of HandState works identically on a phone.
 */
import { createStartup } from './hands/startup';
import { mapHandToSynth } from './mapping/handToSynth';
import { createSynth } from './synth/engine';
import { createAudioPanel } from './ui/audioPanel';
import { createLayout } from './ui/layout';
import { createCameraPanel } from './ui/cameraPanel';
import { createOverlay } from './ui/overlay';
import { createSliderFallback } from './ui/sliders';

function boot() {
  const ui = createLayout(document.getElementById('app')!);
  // Camera and hand model start first, so the prompt and the download begin as the page loads.
  const startup = createStartup(ui.camera.video, () => createSliderFallback(ui.camera.status));
  const panel = createCameraPanel(ui.camera.status, startup);
  const overlay = createOverlay(ui.camera.root, ui.camera.video, ui.camera.canvas);
  startup.onStatus((status) => {
    panel.show(status);
    overlay.setVisible(status.tracking);
  });

  const synth = createSynth();
  const audio = createAudioPanel(ui.instrument, synth);
  synth.onStatus(audio.show);
  // The only hand listener: a second onHand() call would replace this one.
  startup.onHand((s, landmarks) => {
    overlay.draw(s, landmarks);
    synth.update(mapHandToSynth(s));
  });
}

try {
  boot();
} catch (e) {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
}
