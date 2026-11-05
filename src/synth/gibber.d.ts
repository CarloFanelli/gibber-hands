/** The parts of Gibber's prebuilt bundle the engine uses. The package ships no types. */
declare module 'gibber.audio.lib/dist/gibber.audio.js' {
  /** A sound object living in the audio worklet: property writes and method calls are forwarded there. */
  export interface GibberishUgen {
    [property: string]: unknown;
    /** Names its copy in the worklet. */
    id: number;
    connect(target?: GibberishUgen): GibberishUgen;
  }

  export interface Gibberish {
    /** The audio worklet node all of Gibber's sound comes out of. */
    worklet: AudioWorkletNode;
    utilities: {
      /** Registers a sound object built from a genish graph, on the page and in the worklet. */
      Make(definition: {
        name: string;
        type: 'Ugen';
        properties: Record<string, number>;
        constructor: () => unknown;
      }): (props?: Record<string, number>) => GibberishUgen;
    };
    fx: {
      Freeverb(props: Record<string, unknown>): GibberishUgen;
      /** `time` in samples, or a sound object giving it. */
      Delay(props: Record<string, unknown>): GibberishUgen;
    };
    /** Synthesized drums, each sounding on its trigger. */
    instruments: Record<'Kick' | 'Snare' | 'Hat', (props: Record<string, number>) => GibberishUgen>;
    /** Sound objects that combine two others, sample by sample; a stereo one stays stereo. */
    binops: { Mul(a: GibberishUgen, b: GibberishUgen): GibberishUgen; Add(a: GibberishUgen, b: GibberishUgen): GibberishUgen };
  }

  interface Gibber {
    init(options: { workletPath: string; ctx: AudioContext }): Promise<void>;
    Audio: { Gibberish: Gibberish };
  }

  const Gibber: Gibber;
  export default Gibber;
}
