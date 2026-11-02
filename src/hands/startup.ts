/**
 * Starts the camera on page load and reports its status; one request in flight at a time.
 */
import { createCamera, type CameraFailure } from './camera';

export type CameraStatus =
  | { kind: 'pending' }
  | { kind: 'live' }
  | { kind: 'failed'; failure: CameraFailure };

export interface StartupStatus {
  camera: CameraStatus;
}

export interface Startup {
  /** Asks for the camera again after a failure; ignored otherwise. */
  retryCamera(): void;
}

export function createStartup(video: HTMLVideoElement, onStatus: (s: StartupStatus) => void): Startup {
  let camera: CameraStatus = { kind: 'pending' };

  function setCamera(next: CameraStatus) {
    camera = next;
    onStatus({ camera });
  }

  const cam = createCamera(video, () => {
    cam.stop();
    setCamera({ kind: 'failed', failure: { reason: 'disconnected' } });
  });

  async function requestCamera() {
    setCamera({ kind: 'pending' });
    const failure = await cam.start();
    setCamera(failure ? { kind: 'failed', failure } : { kind: 'live' });
  }

  void requestCamera();

  return {
    retryCamera() {
      if (camera.kind === 'failed') void requestCamera();
    }
  };
}
