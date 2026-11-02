/**
 * Front camera → <video>. Reports why the camera can't start as a reason code;
 * the camera panel turns codes into text.
 */

export type CameraFailure =
  | { reason: 'insecure' | 'blocked' | 'not-found' | 'in-use' | 'disconnected' }
  | { reason: 'other'; errorName: string };

export interface Camera {
  /** Stops any previous stream, then asks for the camera and plays it. Resolves to null once the video plays. */
  start(): Promise<CameraFailure | null>;
  stop(): void;
}

/** Maps a getUserMedia error name to a reason. A page that isn't a secure context wins over any error. */
export function cameraFailure(errorName: string, isSecure: boolean): CameraFailure {
  if (!isSecure) return { reason: 'insecure' };
  switch (errorName) {
    case 'NotAllowedError':
      return { reason: 'blocked' };
    case 'NotFoundError':
    case 'OverconstrainedError':
      return { reason: 'not-found' };
    case 'NotReadableError':
      return { reason: 'in-use' };
    default:
      return { reason: 'other', errorName };
  }
}

/** `onEnded` fires when the browser ends the stream (camera unplugged, permission revoked), never on stop(). */
export function createCamera(video: HTMLVideoElement, onEnded: () => void): Camera {
  let stream: MediaStream | null = null;

  function stop() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  }

  return {
    async start() {
      stop();
      try {
        // Outside a secure context navigator.mediaDevices is undefined, so this line throws a TypeError.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        stream.getVideoTracks().forEach((track) => track.addEventListener('ended', onEnded));
        video.srcObject = stream;
        await video.play();
        return null;
      } catch (err) {
        stop();
        return cameraFailure(err instanceof Error ? err.name : String(err), isSecureContext);
      }
    },
    stop
  };
}
