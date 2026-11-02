/**
 * Camera panel status: every message the player reads about the camera, and its Try again button.
 */
import type { CameraFailure } from '../hands/camera';
import type { StartupStatus } from '../hands/startup';

const FAILURE_TEXT: Record<Exclude<CameraFailure['reason'], 'other'>, string> = {
  insecure: 'Page not secure — open the https link',
  blocked: 'Camera access blocked',
  'not-found': 'No camera found',
  'in-use': 'Camera in use by another app — close it and try again',
  disconnected: 'Camera disconnected'
};

const UNBLOCK_HINT = 'To unblock it, click the camera icon in the address bar, allow the camera, then try again.';

export interface CameraPanel {
  show(status: StartupStatus): void;
}

export function createCameraPanel(root: HTMLElement, onRetryCamera: () => void): CameraPanel {
  const card = document.createElement('div');
  card.className = 'status-card';
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const hint = document.createElement('p');
  hint.className = 'status-hint';
  hint.textContent = UNBLOCK_HINT;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'retry';
  retry.textContent = 'Try again';
  retry.hidden = true;
  retry.addEventListener('click', onRetryCamera);
  card.append(message, hint, retry);
  root.append(card);

  return {
    show({ camera }) {
      card.hidden = camera.kind === 'live';
      if (camera.kind === 'pending') {
        message.textContent = 'Allow camera access to play';
        hint.hidden = true;
        // Shown only after a failure: stays visible but disabled until the new request settles.
        retry.disabled = true;
      } else if (camera.kind === 'failed') {
        const { failure } = camera;
        message.textContent =
          failure.reason === 'other' ? `Camera couldn't start (${failure.errorName})` : FAILURE_TEXT[failure.reason];
        hint.hidden = failure.reason !== 'blocked';
        retry.hidden = false;
        retry.disabled = false;
      }
    }
  };
}
