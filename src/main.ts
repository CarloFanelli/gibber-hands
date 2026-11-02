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
import { createTracker } from './hands/tracker';
import { createSynth } from './synth/engine';
import { mapHandToSynth } from './mapping/handToSynth';
import { createLayout } from './ui/layout';
import { createSliderFallback } from './ui/sliders';
import { loadPresets } from './synth/presets';

async function boot() {
  const ui = createLayout(document.getElementById('app')!);
  const synth = await createSynth();
  const presets = loadPresets();
  ui.presets.render(presets, (p) => synth.applyPreset(p));

  let source: { onState: (cb: (s: import('./hands/types').HandState) => void) => void };

  try {
    source = await createTracker(ui.camera.video, ui.camera.canvas);
  } catch (err) {
    console.warn('Webcam unavailable, falling back to sliders', err);
    source = createSliderFallback(ui.camera.root);
  }

  source.onState((state) => {
    const params = mapHandToSynth(state);
    synth.update(params);
    ui.liveCode.show(synth.currentCode());
    ui.overlay.draw(state);
  });
}

boot().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
});
