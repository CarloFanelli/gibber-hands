/**
 * Instrument panel audio controls: the Start / Stop audio button, and why the audio engine couldn't start,
 * with Try again when retrying can help. Until audio first starts, the button that starts it stands out.
 */
import type { EngineStatus, SynthEngine } from '../synth/engine';
import type { EngineFailure } from '../synth/engineFailure';
import { statusCard } from './statusCard';

const FAILURE_TEXT: Record<Exclude<EngineFailure['reason'], 'other'>, string> = {
  unsupported: "This browser can't run the audio engine",
  network: "Audio engine couldn't load: network"
};

/** The class of the button that starts audio, until it first does: larger, with a ring. */
const PROMINENT = 'prominent';

export interface AudioPanel {
  show(status: EngineStatus): void;
}

export function createAudioPanel(root: HTMLElement, engine: Pick<SynthEngine, 'start' | 'stop'>): AudioPanel {
  let current: EngineStatus = { kind: 'off' };
  let started = false;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'audio-toggle';
  toggle.addEventListener('click', () => (current.kind === 'on' ? engine.stop() : engine.start()));
  root.append(toggle);
  const failure = statusCard(root, () => engine.start());

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
      toggle.disabled = status.kind === 'starting';
      toggle.textContent =
        status.kind === 'on' ? 'Stop audio' : status.kind === 'starting' ? 'Starting audio…' : 'Start audio';
      if (status.kind === 'failed') {
        const f = status.failure;
        failure.message.textContent = f.reason === 'other' ? `Audio engine couldn't start (${f.errorName})` : FAILURE_TEXT[f.reason];
        failure.retry.hidden = f.reason === 'unsupported';
        failure.retry.disabled = false;
      } else if (retrying) {
        failure.retry.disabled = true;
      }
    }
  };
}
