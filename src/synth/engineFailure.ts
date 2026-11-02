/**
 * Why the audio engine couldn't start. No Gibber import here, so tests run without the browser bundle.
 */

export type EngineFailure = { reason: 'unsupported' | 'network' } | { reason: 'other'; errorName: string };

/** The sound worklet file couldn't be downloaded: offline, blocked, an HTTP error or a stalled download. */
export class EngineDownloadError extends Error {
  override name = 'EngineDownloadError';
}

/**
 * The engine runs in an audio worklet. Without one Gibber would fall back to a deprecated
 * ScriptProcessor on the page's own thread, which competes with hand tracking: treated as unsupported.
 */
export function audioSupported(scope: { AudioContext?: unknown; AudioWorkletNode?: unknown }): boolean {
  return typeof scope.AudioContext === 'function' && typeof scope.AudioWorkletNode === 'function';
}

export function engineFailure(error: unknown): EngineFailure {
  if (error instanceof EngineDownloadError) return { reason: 'network' };
  return { reason: 'other', errorName: error instanceof Error || error instanceof DOMException ? error.name : 'Error' };
}
