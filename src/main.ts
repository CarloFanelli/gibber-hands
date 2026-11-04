/**
 * gibber-hands — entry point.
 *
 * Wiring only. Each module below owns one concern and exposes a tiny interface;
 * keep this file free of logic so the data flow stays readable:
 *
 *   webcam frame ──► hands/tracker ──► HandPair ──► mapping ──► SynthParams ──► synth/engine
 *                                        │                          │ note lane       │
 *                                        └──► ui/overlay ◄──────────┘                 └──► ui/liveCode (Gibber code shown live)
 *                                             (landmarks, gesture labels, note lanes)
 *
 * A HandPair holds a HandState per side, right and left, and each hand plays its own note: the engine
 * has a voice per side. mapping/roles says which side is the lead hand, and ui/leadHandSwitch swaps the
 * roles, remembered in browser storage.
 *
 * The "no camera" path uses ui/sliders to produce the same HandPair shape, with the sliders as the lead
 * hand, so everything downstream works identically on a phone.
 *
 * ui/presetList picks the preset: its notes go to the mapping and the overlay, its sound to the engine
 * and the live code. The choice is remembered in browser storage.
 *
 * A first visit is guided: ui/statusLine says what is on, and ui/stepHints shows the next step over the
 * camera view until a first sound has lasted a second, which browser storage remembers.
 *
 * ui/shortcuts maps keys to the same actions as the controls: presets, audio, the code panel and ui/helpSheet.
 */
import { createStartup, type StartupStatus } from './hands/startup';
import { SIDES, emptyPair, type HandPair, type Side } from './hands/types';
import { mapHandToSynth, type SynthParams } from './mapping/handToSynth';
import { leadSide, roles } from './mapping/roles';
import { createSynth, type EngineStatus, type Sounds } from './synth/engine';
import { PRESETS, presetIndex } from './synth/presets';
import { gibberSnippet } from './synth/snippet';
import { createAudioPanel } from './ui/audioPanel';
import { createLayout } from './ui/layout';
import { createCameraPanel } from './ui/cameraPanel';
import { createHelpSheet } from './ui/helpSheet';
import { createLeadHandSwitch } from './ui/leadHandSwitch';
import { createLiveCode } from './ui/liveCode';
import { createOverlay } from './ui/overlay';
import { createPresetList } from './ui/presetList';
import { createSliderFallback, type SliderFallback } from './ui/sliders';
import { cameraMode, createStatusLine } from './ui/statusLine';
import { createStepHints, firstSoundTimer, nextStep } from './ui/stepHints';
import { listenForShortcuts } from './ui/shortcuts';
import { readStored, writeStored } from './ui/storage';
import { throttle } from './ui/throttle';

/** The live code panel updates at most this often, in ms. */
const LIVE_CODE_PERIOD_MS = 100;
/** Browser storage key of the last preset picked. */
const PRESET_KEY = 'gibber-hands-preset';
/** Browser storage key set once step hints are done for good. */
const HINTS_DONE_KEY = 'gibber-hands-hints-done';
/** Browser storage key of the lead side, "left" once the roles are swapped. */
const LEAD_HAND_KEY = 'gibber-hands-lead-hand';

function boot() {
  const ui = createLayout(document.getElementById('app')!);
  // Camera and hand model start first, so the prompt and the download begin as the page loads.
  let sliders: SliderFallback | null = null;
  let lead = leadSide(readStored(LEAD_HAND_KEY));
  const startup = createStartup(ui.camera.video, () => (sliders = createSliderFallback(ui.camera.status, lead)));
  const panel = createCameraPanel(ui.camera.status, startup);
  const overlay = createOverlay(ui.camera.root, ui.camera.video, ui.camera.canvas);
  const hints = createStepHints(ui.camera.root);

  const statusLine = createStatusLine(ui.instrument);
  const synth = createSynth();
  const audio = createAudioPanel(ui.instrument, synth);
  let preset = presetIndex(readStored(PRESET_KEY));
  const presets = createPresetList(ui.instrument, selectPreset);
  const liveCode = createLiveCode(ui.code);
  const showCode = throttle((s: Sounds) => {
    const hands = roles(s, lead);
    liveCode.show(gibberSnippet([hands.lead, hands.second], PRESETS[preset]!));
  }, LIVE_CODE_PERIOD_MS);

  // Hand pairs start only once tracking or the sliders run: until then, no hand plays silence.
  let pair: HandPair = emptyPair(0);
  let sounds: Sounds | null = null;
  /** Maps each hand of the last pair with the current preset's notes, and plays them. */
  function playHands(): Sounds {
    const lanes = PRESETS[preset]!.lanes;
    const previous = sounds;
    const map = (side: Side): SynthParams => mapHandToSynth(pair[side].state, previous?.[side] ?? null, lanes);
    const next: Sounds = { right: map('right'), left: map('left') };
    sounds = next;
    const leading = next[lead];
    sliders?.showNote(leading.lane === null ? null : lanes[leading.lane]!.name);
    synth.update(next);
    showCode(next);
    guide();
    return next;
  }

  // Set at once by startup.onStatus below.
  let startupStatus!: StartupStatus;
  let engineStatus: EngineStatus = { kind: 'off' };
  let hintsDone = readStored(HINTS_DONE_KEY) !== null;
  const firstSound = firstSoundTimer(() => {
    hintsDone = true;
    writeStored(HINTS_DONE_KEY, '1');
    guide();
  });
  /** The status line, and the step hint for the first step not done until a first sound has lasted a second. */
  function guide() {
    statusLine.show(startupStatus, engineStatus);
    const audioOn = engineStatus.kind === 'on';
    firstSound.update(audioOn && SIDES.some((side) => (sounds?.[side].amp ?? 0) > 0));
    const hand = SIDES.some((side) => pair[side].state.present);
    const step = hintsDone ? null : nextStep({ camera: cameraMode(startupStatus), hand, audio: audioOn });
    hints.show(step);
    // The camera view's own prompts for these steps give way while a step hint says them.
    overlay.hideRaiseHand(step === 'hand');
    panel.hidePrompt(step === 'camera');
  }
  startup.onStatus((status) => {
    startupStatus = status;
    panel.show(status);
    overlay.setVisible(status.tracking);
    guide();
  });
  synth.onStatus((status) => {
    engineStatus = status;
    audio.show(status);
    guide();
  });

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
    // The sliders send a hand pair only when moved: play the last one again, with this preset's notes.
    playHands();
  }
  usePreset();

  createLeadHandSwitch(ui.instrument, lead, (side) => {
    lead = side;
    writeStored(LEAD_HAND_KEY, side);
    sliders?.setLeadSide(side);
  });

  const help = createHelpSheet(document.body);
  listenForShortcuts((action) => {
    if (action.kind === 'preset') selectPreset(action.index);
    else if (action.kind === 'audio') audio.startOrStop();
    else if (action.kind === 'code') ui.toggleCodePanel();
    else help.toggle();
  });

  // The only hand listener: a second onHand() call would replace this one.
  startup.onHand((next) => {
    pair = next;
    const played = playHands();
    overlay.draw(pair, SIDES.flatMap((side) => (played[side].lane === null ? [] : [played[side].lane])));
  });
}

try {
  boot();
} catch (e) {
  console.error(e);
  document.body.innerHTML = `<pre>Boot failed: ${String(e)}</pre>`;
}
