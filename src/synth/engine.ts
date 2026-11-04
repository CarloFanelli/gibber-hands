/**
 * The audio engine, and the only file that imports Gibber.
 *
 * Each hand, right and left, has one voice per preset, built in Gibber's audio worklet: its oscillator into
 * a resonant low-pass filter, both gliding to new settings, then the preset's reverb or delay, then the
 * preset's level. Only the current preset's level is up; a switch glides one down and the other up, a
 * crossfade that also ends the old preset's echoes. A resting voice still runs, so its way into the effect
 * closes too: otherwise the effect would fill with its old note and replay it when the preset comes back.
 * After all of a hand's voices comes its volume, so its silence silences its tails too, whatever the other
 * hand plays. Every setting glides in the worklet: Gibber itself changes a setting in one jump, which clicks.
 * Two loud hands can add up past full scale: a limiter after the worklet keeps their peaks down.
 *
 * Browsers allow audio only from a user gesture: start() must be called from the click handler.
 */
import Gibber, { type Gibberish, type GibberishUgen } from 'gibber.audio.lib/dist/gibber.audio.js';
import workletUrl from 'gibber.audio.lib/dist/gibberish_worklet.js?url';
import { SIDES, type Side } from '../hands/types';
import type { SynthParams } from '../mapping/handToSynth';
import { EngineDownloadError, audioSupported, engineFailure, type EngineFailure } from './engineFailure';
import { CROSSFADE_MS, CUTOFF_RAMP_MS, PITCH_SLIDE_MS, TOGGLE_RAMP_MS, slideSamples } from './ramp';
import { PRESETS, delaySamples, reverbMix, type Oscillator, type Preset } from './presets';

export type EngineStatus = { kind: 'off' | 'starting' | 'on' } | { kind: 'failed'; failure: EngineFailure };

export interface SynthEngine {
  /** Calls `cb` with the current status at once, then on every change. */
  onStatus(cb: (s: EngineStatus) => void): void;
  /** Starts the engine, or resumes it after stop(). Ignored while starting or on. */
  start(): void;
  /** Fades everything to silence; start() resumes. */
  stop(): void;
  /** The sound each hand asks for, heard while the engine is on. */
  update(sounds: Sounds): void;
  /** Crossfades to preset `index` (a PRESETS index), or starts on it if the engine isn't running yet. */
  setPreset(index: number): void;
}

/** A stalled download of the sound worklet counts as failed after this long. */
const DOWNLOAD_TIMEOUT_MS = 15_000;
/** Gibber's start reports no errors: one that takes longer than this has failed. */
const INIT_TIMEOUT_MS = 10_000;
/** The limiter's threshold, just above one hand's loudest peak (−4.8 dBFS), so one hand passes unchanged. */
const LIMIT_DB = -4.5;
const LIMIT_RATIO = 20;

/** The worklet's global Gibberish, as the graphs below see it. */
declare const Gibberish: {
  genish: { in(name: string): unknown; slide(input: unknown, up: unknown, down: unknown): unknown };
  oscillators: { factory(shape: Oscillator['shape'], frequency: unknown, antialias: boolean): unknown };
  filters: { factory(input: unknown, cutoff: unknown, saturation: number, props: { filterModel: number }): unknown };
};

/**
 * A voice's graph. Its source text is sent to the audio worklet and run there, so it can use only the
 * worklet's globals and its argument: every setting the engine changes comes in as a named input.
 */
function voiceGraph(shape: Oscillator['shape']) {
  const g = Gibberish.genish;
  // A setting glides to each new value over its `…Slide` input, a length in samples (1 jumps at once).
  const glide = (name: string) => {
    const samples = g.in(name + 'Slide');
    return g.slide(g.in(name), samples, samples);
  };
  // Only the pulse wave is antialiased: the plain one swings 0..1, and its offset would thump with the volume.
  const oscillator = Gibberish.oscillators.factory(shape, glide('frequency'), shape === 'pwm');
  // Filter model 1 is Gibberish's 24 dB ladder (Moog) filter, as in its stock Synth. Its resonance is the
  // `Q` input, and its cutoff a fraction of the Nyquist frequency.
  return Gibberish.filters.factory(oscillator, glide('cutoff'), 0, { filterModel: 1 });
}

/**
 * A level that glides to each new value like the voice's settings: a voice's way into its effect, a
 * preset's output, or a hand's volume. Runs in the worklet too.
 */
function levelGraph() {
  const g = Gibberish.genish;
  const samples = g.in('levelSlide');
  return g.slide(g.in('level'), samples, samples);
}

interface Engine {
  /**
   * Moves each side's sound of the current preset to what its hand asks for (silence when null), each
   * volume ramping over its own ramp time, or over `rampMs` when given (Start and Stop).
   */
  play(sounds: Sounds | null, rampMs?: number): void;
  setPreset(index: number): void;
}

/** What each hand asks for, by side. */
export type Sounds = Record<Side, SynthParams>;

export function createSynth(): SynthEngine {
  let status: EngineStatus = { kind: 'off' };
  let listener: ((s: EngineStatus) => void) | null = null;
  let engine: Engine | null = null;
  let wanted: Sounds | null = null;
  let preset = 0;

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
      bootEngine(ctx, preset).then(
        (booted) => {
          engine = booted;
          // A preset picked while the engine started.
          booted.setPreset(preset);
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
    update(sounds) {
      wanted = sounds;
      if (status.kind === 'on') engine?.play(sounds);
    },
    setPreset(index) {
      preset = index;
      engine?.setPreset(index);
    }
  };
}

async function bootEngine(ctx: AudioContext, initialPreset: number): Promise<Engine> {
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

  // The limiter acts only above one hand's loudest peak; its own make-up gain is taken back off after it.
  const limiter = new DynamicsCompressorNode(ctx, { threshold: LIMIT_DB, knee: 0, ratio: LIMIT_RATIO, attack: 0.001, release: 0.1 });
  const makeUp = new GainNode(ctx, { gain: 10 ** (-limiterMakeUpDb(LIMIT_DB, LIMIT_RATIO) / 20) });
  G.worklet.disconnect();
  G.worklet.connect(limiter).connect(makeUp).connect(ctx.destination);

  const rate = ctx.sampleRate;
  // Make runs a graph's constructor from its source text, without arguments: one per shape, the shape baked in.
  const voiceTypes = new Map<Oscillator['shape'], ReturnType<typeof G.utilities.Make>>();
  const voiceType = (oscillator: Oscillator) => {
    const known = voiceTypes.get(oscillator.shape);
    if (known) return known;
    const made = G.utilities.Make({
      name: `HandVoice_${oscillator.shape}`,
      type: 'Ugen',
      properties: {
        frequency: 440,
        frequencySlide: 1,
        cutoff: 0.05,
        cutoffSlide: 1,
        Q: 0.5,
        ...pulseWidth(oscillator)
      },
      constructor: new Function(`return (${voiceGraph})(${JSON.stringify(oscillator.shape)})`) as () => unknown
    });
    voiceTypes.set(oscillator.shape, made);
    return made;
  };
  const Level = G.utilities.Make({
    name: 'PresetLevel',
    type: 'Ugen',
    properties: { level: 0, levelSlide: slideSamples(CROSSFADE_MS, rate) },
    constructor: levelGraph
  });

  // Each side has a voice per preset and its own volume after all of them.
  const buildSide = () => {
    const volume = Level();
    const voices = PRESETS.map((preset) => {
      const sound = voiceType(preset.oscillator)({ Q: preset.resonance, ...pulseWidth(preset.oscillator) });
      const send = Level();
      const level = Level();
      G.binops.Mul(G.binops.Mul(effect(G, preset, G.binops.Mul(sound, send), rate), level), volume).connect();
      // What was last sent to this voice; NaN until it plays, so its first note and brightness jump.
      return { preset, sound, send, level, frequency: NaN, cutoff: NaN, rising: false };
    });
    return { volume, voices, sent: { amp: NaN, rampMs: NaN } };
  };
  const sides: Record<Side, ReturnType<typeof buildSide>> = { right: buildSide(), left: buildSide() };

  const nyquist = rate / 2;
  let current = initialPreset;
  for (const side of SIDES) sides[side].voices[current]!.rising = true;

  function playSide(side: Side, p: SynthParams | null, rampMs: number) {
    const { volume, voices, sent } = sides[side];
    const voice = voices[current]!;
    const amp = p ? p.amp : 0;
    if (p && p.frequency !== voice.frequency) {
      // Only a note being heard slides to the next one. From silence (fingers apart, Stop, the first
      // start), and on the voice a preset switch brings in, the new note starts at once instead of
      // gliding in from an old one.
      const heard = sent.amp > 0 && !Number.isNaN(voice.frequency);
      voice.sound.frequencySlide = slideSamples(heard ? PITCH_SLIDE_MS : 0, rate);
      voice.sound.frequency = p.frequency;
      voice.frequency = p.frequency;
    }
    if (p && p.cutoff !== voice.cutoff) {
      voice.sound.cutoffSlide = slideSamples(Number.isNaN(voice.cutoff) ? 0 : CUTOFF_RAMP_MS, rate);
      voice.sound.cutoff = p.cutoff / nyquist;
      voice.cutoff = p.cutoff;
    }
    // Only once a hand is in view, and after its note and brightness: until then the voice holds a note
    // no hand chose (or the worklet may render between two messages), and a way into the effect opened
    // first would fill the effect with it, to be heard when the hand plays.
    if (p && p.lane !== null && voice.rising) {
      voice.send.level = 1;
      voice.level.level = voice.preset.gain;
      voice.rising = false;
    }
    if (amp !== sent.amp || rampMs !== sent.rampMs) {
      volume.levelSlide = slideSamples(rampMs, rate);
      volume.level = amp;
    }
    sides[side].sent = { amp, rampMs };
  }

  return {
    play(sounds, rampMs) {
      for (const side of SIDES) {
        const p = sounds ? sounds[side] : null;
        playSide(side, p, rampMs ?? p?.ampRampMs ?? 0);
      }
    },
    setPreset(index) {
      if (index === current) return;
      for (const side of SIDES) {
        const old = sides[side].voices[current]!;
        const next = sides[side].voices[index]!;
        old.send.level = old.level.level = 0;
        old.rising = false;
        next.frequency = next.cutoff = NaN;
        next.rising = true;
      }
      current = index;
    }
  };
}

/**
 * The level a DynamicsCompressorNode adds to everything, in dB: the Web Audio specification raises its
 * output by 0.6 times the reduction it applies to a full-scale signal.
 */
function limiterMakeUpDb(thresholdDb: number, ratio: number): number {
  return 0.6 * -thresholdDb * (1 - 1 / ratio);
}

/** The pulse wave's width setting; other shapes have none. */
function pulseWidth(oscillator: Oscillator): Record<string, number> {
  return oscillator.shape === 'pwm' ? { pulsewidth: oscillator.pulsewidth } : {};
}

/** The preset's reverb or delay, taking `input`. */
function effect(G: Gibberish, preset: Preset, input: GibberishUgen, sampleRate: number): GibberishUgen {
  const fx = preset.effect;
  return fx.kind === 'reverb'
    ? G.fx.Freeverb({ input, ...reverbMix(fx.mix) })
    : G.fx.Delay({ input, time: delaySamples(fx.measures, sampleRate), feedback: fx.feedback, wetdry: fx.mix });
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
