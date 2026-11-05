/**
 * Step hints: a short prompt over the camera view for the first step the visitor hasn't done yet, with an
 * animated hand icon (styles.css), until a first sound has lasted a second.
 */
import type { CameraMode } from './statusLine';

export type Step = 'camera' | 'hand' | 'audio' | 'squeeze' | 'pinch-slider';

/** What the visitor has done so far. */
export interface Progress {
  camera: CameraMode;
  /** A hand is in view. */
  hand: boolean;
  /** Audio is on. */
  audio: boolean;
}

export const STEP_WORDS: Record<Step, string> = {
  camera: 'Allow the camera',
  hand: 'Raise your hand',
  audio: 'Start audio',
  squeeze: 'Squeeze to play',
  'pinch-slider': 'Lower the pinch slider'
};

/** The first step not done yet. The sliders need no camera and no hand: audio, then the pinch slider. */
export function nextStep(p: Progress): Step {
  if (p.camera === 'sliders') return p.audio ? 'pinch-slider' : 'audio';
  if (p.camera === 'waiting') return 'camera';
  if (!p.hand) return 'hand';
  return p.audio ? 'squeeze' : 'audio';
}

/** Step hints end for good once a sound has lasted this long, in ms. */
const FIRST_SOUND_MS = 1000;

/**
 * Calls `onDone` once, when a sound has lasted FIRST_SOUND_MS. Timed, not counted in hand states: the
 * sliders send none while held still.
 */
export function firstSoundTimer(onDone: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let done = false;
  return {
    /** Whether a sound is playing now. */
    update(sounding: boolean) {
      if (done) return;
      if (sounding && timer === null) {
        timer = setTimeout(() => {
          done = true;
          onDone();
        }, FIRST_SOUND_MS);
      } else if (!sounding && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}

export interface StepHints {
  /** Shows the hint for `step`, or none. */
  show(step: Step | null): void;
}

/** An open hand: four fingers over a rounded palm, the thumb to the side. */
const HAND_ICON = `<svg class="step-hint-icon" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
  <rect x="9" y="6" width="3.6" height="12" rx="1.8"/>
  <rect x="13.4" y="3" width="3.6" height="15" rx="1.8"/>
  <rect x="17.8" y="4" width="3.6" height="14" rx="1.8"/>
  <rect x="22.2" y="7" width="3.4" height="11" rx="1.7"/>
  <rect x="3.5" y="14" width="3.6" height="10" rx="1.8" transform="rotate(-35 5.3 19)"/>
  <path d="M8.5 15h17.1v5.5c0 5-3.6 8.5-8.5 8.5s-8.6-3.5-8.6-8.5z"/>
</svg>`;

export function createStepHints(root: HTMLElement): StepHints {
  const hint = document.createElement('div');
  hint.className = 'step-hint';
  hint.setAttribute('role', 'status');
  hint.innerHTML = HAND_ICON;
  const words = document.createElement('span');
  words.className = 'step-hint-words';
  hint.append(words);
  hint.hidden = true;
  root.append(hint);
  let shown: Step | null = null;

  return {
    show(step) {
      if (step === shown) return;
      shown = step;
      hint.hidden = step === null;
      if (step === null) return;
      // The icon's animation follows the step (styles.css).
      hint.dataset.step = step;
      words.textContent = STEP_WORDS[step];
    }
  };
}
