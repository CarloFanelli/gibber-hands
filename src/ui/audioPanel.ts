/**
 * The top bar's audio controls: the Start / Stop audio button, and why the audio engine couldn't start,
 * with Try again when retrying can help. Until audio first starts, the button that starts it stands out.
 */
import type { EngineStatus, SynthEngine } from '../synth/engine';
import type { EngineFailure } from '../synth/engineFailure';
import { FILLED } from './look';
import { statusCard } from './statusCard';

const FAILURE_TEXT: Record<Exclude<EngineFailure['reason'], 'other'>, string> = {
  unsupported: "This browser can't run the audio engine",
  network: "Audio engine couldn't load: network"
};

/** The class of the button that starts audio, until it first does: with a ring, and larger in a mid-width top bar. */
const PROMINENT = 'prominent';
const PROMINENT_LOOK =
  '[&.prominent]:min-h-[38px] [&.prominent]:px-4 [&.prominent]:py-0 [&.prominent]:text-base [&.prominent]:shadow-glow @max-[900px]/top-bar:[&.prominent]:px-6 @max-[900px]/top-bar:[&.prominent]:text-xl @max-[480px]/top-bar:[&.prominent]:min-h-11 @max-[480px]/top-bar:[&.prominent]:px-3.5 @max-[480px]/top-bar:[&.prominent]:text-base';

export interface AudioPanel {
  show(status: EngineStatus): void;
  /** Presses the button that starts or stops audio, Try again after a failure, if it can be pressed now. */
  startOrStop(): void;
}

export function createAudioPanel(root: HTMLElement, engine: Pick<SynthEngine, 'start' | 'stop'>): AudioPanel {
  let current: EngineStatus = { kind: 'off' };
  let started = false;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `${FILLED} px-3.5 py-2.5 aria-disabled:cursor-default aria-disabled:opacity-50 ${PROMINENT_LOOK}`;
  toggle.addEventListener('click', () => {
    if (current.kind === 'starting') return;
    if (current.kind === 'on') engine.stop();
    else engine.start();
  });
  root.append(toggle);
  // In the top bar the card is one row of words and the button, with no card around them.
  const failure = statusCard(root, () => engine.start(), 'flex min-w-0 items-center gap-2.5 pointer-events-auto');
  failure.message.classList.add('overflow-hidden', 'text-ellipsis', 'text-warn');
  failure.retry.classList.add(...PROMINENT_LOOK.split(' '));
  failure.retry.title = 'Try to start the audio engine again (Space)';

  return {
    show(status) {
      // After a failure the card stays during the next attempt, its Try again disabled until it settles.
      const retrying = status.kind === 'starting' && current.kind === 'failed';
      current = status;
      if (status.kind === 'on') started = true;
      toggle.classList.toggle(PROMINENT, !started);
      failure.retry.classList.toggle(PROMINENT, !started);
      failure.card.hidden = !(status.kind === 'failed' || retrying);
      toggle.hidden = !failure.card.hidden;
      // Not `disabled` while starting: a dialog closing as audio starts gives focus back to this button.
      toggle.setAttribute('aria-disabled', String(status.kind === 'starting'));
      toggle.textContent =
        status.kind === 'on' ? 'Stop audio' : status.kind === 'starting' ? 'Starting audio…' : 'Start audio';
      toggle.title =
        status.kind === 'on' ? 'Silence the sound (Space)' : status.kind === 'starting' ? 'The audio engine is loading' : 'Start the sound, then play with your hands (Space)';
      if (status.kind === 'failed') {
        const f = status.failure;
        failure.message.textContent = f.reason === 'other' ? `Audio engine couldn't start (${f.errorName})` : FAILURE_TEXT[f.reason];
        failure.retry.hidden = f.reason === 'unsupported';
        failure.retry.disabled = false;
      } else if (retrying) {
        failure.retry.disabled = true;
      }
    },
    startOrStop() {
      const button = failure.card.hidden ? toggle : failure.retry;
      if (!button.hidden && !button.disabled) button.click();
    }
  };
}
