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
import { createSynth } from './synth/engine';
import { createLayout } from './ui/layout';
import { createCameraPanel } from './ui/cameraPanel';
import { loadPresets } from './synth/presets';

async function boot() {
  const ui = createLayout(document.getElementById('app')!);
  // The camera is requested before any await, so its prompt appears as the page loads.
  const panel = createCameraPanel(ui.camera.status, () => startup.retryCamera());
  const startup = createStartup(ui.camera.video, panel.show);

  const synth = await createSynth();
  const presets = loadPresets();
  ui.presets.render(presets, (p) => synth.applyPreset(p));
}

boot().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
});
