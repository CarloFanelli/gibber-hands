/**
 * Camera panel status: every message the player reads about the camera and the hand model,
 * with their Try again buttons.
 */
import type { CameraFailure } from '../hands/camera';
import type { ModelFailure } from '../hands/modelSource';
import type { Startup, StartupStatus } from '../hands/startup';

const CAMERA_FAILURE_TEXT: Record<Exclude<CameraFailure['reason'], 'other'>, string> = {
  insecure: 'Page not secure — open the https link',
  blocked: 'Camera access blocked',
  'not-found': 'No camera found',
  'in-use': 'Camera in use by another app — close it and try again',
  disconnected: 'Camera disconnected'
};

const MODEL_FAILURE_TEXT: Record<Exclude<ModelFailure['reason'], 'blocked'>, string> = {
  unsupported: "This browser can't run hand tracking",
  offline: 'Hand tracking unavailable: no network',
  stalled: 'Hand tracking unavailable: the download stalled',
  damaged: 'Hand model is damaged'
};

const UNBLOCK_HINT = 'To unblock it, click the camera icon in the address bar, allow the camera, then try again.';

export interface CameraPanel {
  show(status: StartupStatus): void;
}

export function createCameraPanel(root: HTMLElement, startup: Pick<Startup, 'retryCamera' | 'retryModel'>): CameraPanel {
  const camera = statusCard(root, () => startup.retryCamera());
  const hint = document.createElement('p');
  hint.className = 'status-hint';
  hint.textContent = UNBLOCK_HINT;
  camera.message.after(hint);
  const model = statusCard(root, () => startup.retryModel());

  return {
    show(status) {
      const cam = status.camera;
      camera.card.hidden = cam.kind === 'live';
      hint.hidden = !(cam.kind === 'failed' && cam.failure.reason === 'blocked');
      if (cam.kind === 'pending') {
        camera.message.textContent = 'Allow camera access to play';
        // Shown only after a failure: stays visible but disabled until the new request settles.
        camera.retry.disabled = true;
      } else if (cam.kind === 'failed') {
        const f = cam.failure;
        camera.message.textContent = f.reason === 'other' ? `Camera couldn't start (${f.errorName})` : CAMERA_FAILURE_TEXT[f.reason];
        camera.retry.hidden = false;
        camera.retry.disabled = false;
      }

      const mod = status.model;
      model.card.hidden = mod.kind === 'ready';
      if (mod.kind === 'loading') {
        model.message.textContent =
          mod.progress === null ? 'Loading hand model…' : `Loading hand model… ${Math.floor(mod.progress * 100)}%`;
        model.retry.disabled = true;
      } else if (mod.kind === 'failed') {
        const f = mod.failure;
        model.message.textContent =
          f.reason === 'blocked' ? `Hand tracking unavailable: couldn't load ${f.file}` : MODEL_FAILURE_TEXT[f.reason];
        model.retry.hidden = f.reason === 'unsupported';
        model.retry.disabled = false;
      }
    }
  };
}

/** A card with a live message and a Try again button, hidden until a failure shows it. */
function statusCard(root: HTMLElement, onRetry: () => void) {
  const card = document.createElement('div');
  card.className = 'status-card';
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'retry';
  retry.textContent = 'Try again';
  retry.hidden = true;
  retry.addEventListener('click', onRetry);
  card.append(message, retry);
  root.append(card);
  return { card, message, retry };
}
