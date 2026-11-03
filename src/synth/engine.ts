/**
 * The audio engine, and the only file that imports Gibber.
 *
 * One voice built in Gibber's audio worklet (a sawtooth into a resonant low-pass filter, both gliding to
 * new settings), then Gibber's reverb at a fixed 30% mix, then the volume. The volume sits after the reverb, so silence silences the
 * reverb's tail too. It is a Web Audio gain with exponential ramps: Gibber itself changes a setting in
 * one jump, which clicks.
 *
 * Browsers allow audio only from a user gesture: start() must be called from the click handler.
 */
import Gibber, { type Gibberish } from 'gibber.audio.lib/dist/gibber.audio.js';
import workletUrl from 'gibber.audio.lib/dist/gibberish_worklet.js?url';
import type { SynthParams } from '../mapping/handToSynth';
import { EngineDownloadError, audioSupported, engineFailure, type EngineFailure } from './engineFailure';
import { CUTOFF_RAMP_MS, PITCH_SLIDE_MS, TOGGLE_RAMP_MS, rampTimeConstant, slideSamples } from './ramp';

export type EngineStatus = { kind: 'off' | 'starting' | 'on' } | { kind: 'failed'; failure: EngineFailure };

export interface SynthEngine {
  /** Calls `cb` with the current status at once, then on every change. */
  onStatus(cb: (s: EngineStatus) => void): void;
  /** Starts the engine, or resumes it after stop(). Ignored while starting or on. */
  start(): void;
  /** Fades everything to silence; start() resumes. */
  stop(): void;
  /** The sound the hand asks for, heard while the engine is on. */
  update(p: SynthParams): void;
}

/** A stalled download of the sound worklet counts as failed after this long. */
const DOWNLOAD_TIMEOUT_MS = 15_000;
/** Gibber's start reports no errors: one that takes longer than this has failed. */
const INIT_TIMEOUT_MS = 10_000;
/**
 * Output gain at full volume. Measured over every note and cutoff: the loudest, C4 at 6.4 kHz, peaks
 * at about −6 dBFS, 3 dB under the −3 dBFS limit.
 */
const FULL_VOLUME = 1.4;
/** Filter resonance in Gibberish's ladder model (0..1): clearly resonant, well short of self-oscillation. */
const RESONANCE = 0.5;
/** Gibberish's Freeverb: `wet1` is the reverb, `wet2` the other channel's reverb, `dry` the voice itself. */
const REVERB = { wet1: 0.3, wet2: 0, dry: 0.7 };

/** The worklet's global Gibberish, as voiceGraph sees it. */
declare const Gibberish: {
  genish: { in(name: string): unknown; slide(input: unknown, up: unknown, down: unknown): unknown };
  oscillators: { factory(type: 'saw', frequency: unknown, antialias: boolean): unknown };
  filters: { factory(input: unknown, cutoff: unknown, saturation: number, props: { filterModel: number }): unknown };
};

/**
 * The voice's graph. Its source text is sent to the audio worklet and run there, so it can use only the
 * worklet's globals: every setting the engine changes comes in as a named input.
 */
function voiceGraph() {
  const g = Gibberish.genish;
  // A setting glides to each new value over its `…Slide` input, a length in samples (1 jumps at once).
  const glide = (name: string) => {
    const samples = g.in(name + 'Slide');
    return g.slide(g.in(name), samples, samples);
  };
  const saw = Gibberish.oscillators.factory('saw', glide('frequency'), false);
  // Filter model 1 is Gibberish's 24 dB ladder (Moog) filter, as in its stock Synth. Its resonance is the
  // `Q` input, and its cutoff a fraction of the Nyquist frequency.
  return Gibberish.filters.factory(saw, glide('cutoff'), 0, { filterModel: 1 });
}

interface Engine {
  /** Moves the sound to `p` (silence when null), the volume ramping over `rampMs`. */
  play(p: SynthParams | null, rampMs: number): void;
}

export function createSynth(): SynthEngine {
  let status: EngineStatus = { kind: 'off' };
  let listener: ((s: EngineStatus) => void) | null = null;
  let engine: Engine | null = null;
  let wanted: SynthParams | null = null;

  function setStatus(s: EngineStatus) {
    status = s;
    listener?.(s);
  }

  return {
    onStatus(cb) {
      listener = cb;
      cb(status);
    },
    start() {
      if (status.kind === 'starting' || status.kind === 'on') return;
      if (engine) {
        engine.play(wanted, TOGGLE_RAMP_MS);
        setStatus({ kind: 'on' });
        return;
      }
      if (!audioSupported(window)) {
        setStatus({ kind: 'failed', failure: { reason: 'unsupported' } });
        return;
      }
      let ctx: AudioContext;
      try {
        // Created here, inside the click: browsers let a page start audio only during a user gesture.
        ctx = new AudioContext({ latencyHint: 'interactive' });
      } catch (error) {
        setStatus({ kind: 'failed', failure: engineFailure(error) });
        return;
      }
      setStatus({ kind: 'starting' });
      bootEngine(ctx).then(
        (booted) => {
          engine = booted;
          booted.play(wanted, TOGGLE_RAMP_MS);
          setStatus({ kind: 'on' });
        },
        (error: unknown) => {
          void ctx.close();
          setStatus({ kind: 'failed', failure: engineFailure(error) });
        }
      );
    },
    stop() {
      if (status.kind !== 'on' || !engine) return;
      engine.play(null, TOGGLE_RAMP_MS);
      setStatus({ kind: 'off' });
    },
    update(p) {
      wanted = p;
      if (status.kind === 'on') engine?.play(p, p.ampRampMs);
    }
  };
}

async function bootEngine(ctx: AudioContext): Promise<Engine> {
  const workletPath = await download(workletUrl);
  // Gibber's music theory module reads the library from window.Gibber, where a <script> tag would put it.
  Object.assign(window, { Gibber });
  const ready = Gibber.init({ workletPath, ctx });
  const G = Gibber.Audio.Gibberish;
  guardFirstRender(G);
  // Gibberish builds its audio graph on the next mousedown, keydown or touchstart, but the click that
  // started the engine has already happened: send one. Gibberish then uses `ctx`, made during that click.
  for (const type of ['mousedown', 'touchstart']) window.dispatchEvent(new Event(type));
  await timeout(ready, INIT_TIMEOUT_MS);
  URL.revokeObjectURL(workletPath);

  const volume = new GainNode(ctx, { gain: 0 });
  G.worklet.disconnect();
  G.worklet.connect(volume).connect(ctx.destination);

  const Voice = G.utilities.Make({
    name: 'HandVoice',
    type: 'Ugen',
    properties: {
      frequency: 440,
      frequencySlide: 1,
      cutoff: 0.05,
      cutoffSlide: slideSamples(CUTOFF_RAMP_MS, ctx.sampleRate),
      Q: RESONANCE
    },
    constructor: voiceGraph
  });
  const voice = Voice();
  G.fx.Freeverb({ input: voice, ...REVERB }).connect();

  const nyquist = ctx.sampleRate / 2;
  let sent = { frequency: NaN, cutoff: NaN, amp: NaN, rampMs: NaN };
  return {
    play(p, rampMs) {
      const amp = p ? p.amp : 0;
      if (p && p.frequency !== sent.frequency) {
        // Only a note being heard slides to the next one. From silence (fingers apart, Stop, the first
        // start), the new note starts at once instead of gliding in from the old one.
        voice.frequencySlide = slideSamples(sent.amp > 0 ? PITCH_SLIDE_MS : 0, ctx.sampleRate);
        voice.frequency = p.frequency;
      }
      if (p && p.cutoff !== sent.cutoff) voice.cutoff = p.cutoff / nyquist;
      if (amp !== sent.amp || rampMs !== sent.rampMs) {
        const now = ctx.currentTime;
        volume.gain.cancelScheduledValues(now);
        volume.gain.setTargetAtTime(amp * FULL_VOLUME, now, rampTimeConstant(rampMs));
      }
      sent = { frequency: p?.frequency ?? sent.frequency, cutoff: p?.cutoff ?? sent.cutoff, amp, rampMs };
    }
  };
}

/**
 * Gibber's worklet starts rendering once it receives its first sound object, but learns which one is the
 * output only from the next message. A render in between finds no graph, and the processor dies for good
 * while still answering messages: silence, about one start in three. A silent stand-in graph, sent as
 * soon as the worklet exists and so ahead of Gibber's own messages, makes that render harmless.
 */
function guardFirstRender(G: Gibberish) {
  let node: AudioWorkletNode | undefined;
  Object.defineProperty(G, 'worklet', {
    configurable: true,
    get: () => node,
    set(created: AudioWorkletNode) {
      node = created;
      created.port.postMessage({ address: 'eval', code: 'this.callback = () => [0, 0]' });
    }
  });
}

/** Fetches the sound worklet and returns a local URL for it, so Gibber's own load can't fail or hang. */
async function download(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return URL.createObjectURL(new Blob([await response.text()], { type: 'text/javascript' }));
  } catch (error) {
    throw new EngineDownloadError("The sound worklet couldn't be downloaded", { cause: error });
  }
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DOMException('Audio engine start timed out', 'TimeoutError')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
