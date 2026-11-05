/**
 * Step hints: a short prompt over the camera view for the first step the visitor hasn't done yet, with an
 * animated hand icon (styles.css), until a first sound has lasted a second. Then one more teaches the second
 * hand's Victory switch, with a Victory icon, until it first switches.
 */
import type { Side } from '../hands/types';
import { SIDE_NAME } from './handWords';
import type { CameraMode } from './statusLine';

export type Step = 'camera' | 'hand' | 'audio' | 'squeeze' | 'pinch-slider' | 'shape';

/** What the visitor has done so far. */
export interface Progress {
  camera: CameraMode;
  /** A hand is in view. */
  hand: boolean;
  /** Audio is on. */
  audio: boolean;
}

export const STEP_WORDS: Record<Exclude<Step, 'shape'>, string> = {
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

/** A step hint's words; the shape step names the second hand by its side. */
export function stepWords(step: Step, secondSide: Side): string {
  return step === 'shape' ? `${SIDE_NAME[secondSide]} hand: shape sound` : STEP_WORDS[step];
}

/** Which step hints are over: the first steps, and the second hand's switch. */
export interface HintsDone {
  /** A first sound has lasted a second. */
  firstSound: boolean;
  /** The second hand has switched to shape mode, or its hint has had its time this visit. */
  shape: boolean;
}

/**
 * The step hint to show, or none: the first steps, then the shape step while the camera sees a hand, so its
 * time isn't spent while the hand model loads.
 */
export function stepToShow(p: Progress, done: HintsDone): Step | null {
  if (!done.firstSound) return nextStep(p);
  return done.shape || p.camera !== 'live' || !p.hand ? null : 'shape';
}

/** The first steps' hints end for good once a sound has lasted this long, in ms. */
export const FIRST_SOUND_MS = 1000;
/** The shape step's hint hides for the visit once shown this long without a break, in ms. */
export const SHAPE_HINT_MS = 10_000;

/**
 * Calls `onDone` once, when a condition has held for `ms`: a sound playing, a hint showing. Timed, not
 * counted in hand states: the sliders send none while held still.
 */
export function holdTimer(ms: number, onDone: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let done = false;
  return {
    /** Whether the condition holds now. */
    update(holds: boolean) {
      if (done) return;
      if (holds && timer === null) {
        timer = setTimeout(() => {
          done = true;
          onDone();
        }, ms);
      } else if (!holds && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}

export interface StepHints {
  /** Shows the hint for `step`, or none; `secondSide` is the second hand's side, which the shape step names. */
  show(step: Step | null, secondSide: Side): void;
}

/** An open hand: four fingers over a rounded palm, the thumb to the side. */
const HAND_ICON = `<svg class="step-hint-icon step-hint-hand" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
  <rect x="9" y="6" width="3.6" height="12" rx="1.8"/>
  <rect x="13.4" y="3" width="3.6" height="15" rx="1.8"/>
  <rect x="17.8" y="4" width="3.6" height="14" rx="1.8"/>
  <rect x="22.2" y="7" width="3.4" height="11" rx="1.7"/>
  <rect x="3.5" y="14" width="3.6" height="10" rx="1.8" transform="rotate(-35 5.3 19)"/>
  <path d="M8.5 15h17.1v5.5c0 5-3.6 8.5-8.5 8.5s-8.6-3.5-8.6-8.5z"/>
</svg>`;

/** The Victory sign: index and middle finger up and apart over the palm, the thumb to the side. */
const VICTORY_ICON = `<svg class="step-hint-icon step-hint-victory" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
  <rect x="10.2" y="2" width="3.6" height="15" rx="1.8" transform="rotate(-14 12 17)"/>
  <rect x="17.6" y="2" width="3.6" height="15" rx="1.8" transform="rotate(14 19.4 17)"/>
  <rect x="3.5" y="14" width="3.6" height="10" rx="1.8" transform="rotate(-35 5.3 19)"/>
  <path d="M8.5 15h17.1v5.5c0 5-3.6 8.5-8.5 8.5s-8.6-3.5-8.6-8.5z"/>
</svg>`;

export function createStepHints(root: HTMLElement): StepHints {
  const hint = document.createElement('div');
  hint.className = 'step-hint';
  hint.setAttribute('role', 'status');
  // Both icons, the step picking one (styles.css).
  hint.innerHTML = HAND_ICON + VICTORY_ICON;
  const words = document.createElement('span');
  words.className = 'step-hint-words';
  hint.append(words);
  hint.hidden = true;
  root.append(hint);
  let shown: Step | null = null;

  return {
    show(step, secondSide) {
      hint.hidden = step === null;
      if (step === null) {
        shown = null;
        return;
      }
      // The icon and its animation follow the step (styles.css).
      if (step !== shown) hint.dataset.step = shown = step;
      const text = stepWords(step, secondSide);
      if (words.textContent !== text) words.textContent = text;
    }
  };
}
