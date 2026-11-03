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
 *
 * ui/presetList picks the preset: its notes go to the mapping and the overlay, its sound to the engine
 * and the live code. The choice is remembered in browser storage.
 */
import { createStartup } from './hands/startup';
import { EMPTY_HAND, type HandState } from './hands/types';
import { mapHandToSynth, type SynthParams } from './mapping/handToSynth';
import { createSynth } from './synth/engine';
import { PRESETS, presetIndex } from './synth/presets';
import { gibberSnippet } from './synth/snippet';
import { createAudioPanel } from './ui/audioPanel';
import { createLayout } from './ui/layout';
import { createCameraPanel } from './ui/cameraPanel';
import { createOverlay } from './ui/overlay';
import { createPresetList } from './ui/presetList';
import { createSliderFallback, type SliderFallback } from './ui/sliders';
import { readStored, writeStored } from './ui/storage';
import { throttle } from './ui/throttle';

/** The live code panel updates at most this often, in ms. */
const LIVE_CODE_PERIOD_MS = 100;
/** Browser storage key of the last preset picked. */
const PRESET_KEY = 'gibber-hands-preset';

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
  let preset = presetIndex(readStored(PRESET_KEY));
  const presets = createPresetList(ui.instrument, selectPreset);
  const showCode = throttle((p: SynthParams) => ui.liveCode.show(gibberSnippet(p, PRESETS[preset]!)), LIVE_CODE_PERIOD_MS);

  // Hand states start only once tracking or the sliders run: until then, the empty hand plays silence.
  let hand: HandState = EMPTY_HAND;
  let sound: SynthParams | null = null;
  /** Maps the last hand state with the current preset's notes, and plays it. */
  function playHand(): SynthParams {
    const lanes = PRESETS[preset]!.lanes;
    sound = mapHandToSynth(hand, sound, lanes);
    sliders?.showNote(sound.lane === null ? null : lanes[sound.lane]!.name);
    synth.update(sound);
    showCode(sound);
    return sound;
  }

  function selectPreset(index: number) {
    if (index === preset) return;
    preset = index;
    writeStored(PRESET_KEY, PRESETS[index]!.id);
    usePreset();
  }
  function usePreset() {
    presets.show(preset);
    overlay.setLanes(PRESETS[preset]!.lanes.map((n) => n.name));
    synth.setPreset(preset);
    // The sliders send a hand state only when moved: play the last one again, with this preset's notes.
    playHand();
  }
  usePreset();

  // The only hand listener: a second onHand() call would replace this one.
  startup.onHand((s, landmarks) => {
    hand = s;
    overlay.draw(s, landmarks, playHand().lane);
  });
}

try {
  boot();
} catch (e) {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
}
