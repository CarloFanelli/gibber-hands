/**
 * Fallback without a camera or a hand model: four 0..1 sliders and a gesture menu that emit the same
 * HandState the tracker would, as the lead hand. An Octave choice and an effect slider stand in for the
 * second hand in shape mode: Up is its squeeze held, Down its thumbs-down, and the slider its height. Native
 * controls, so keyboard and touch work without extra code.
 */
import { gestureName } from '../hands/gesture';
import type { HandSource } from '../hands/tracker';
import { GESTURE_NAMES, type GestureName, type HandPair, type HandState, type Side } from '../hands/types';
import { PLAYING_ZONE } from '../mapping/handToSynth';
import type { Octave, SecondHand } from '../mapping/shape';
import { GESTURE_LABELS } from './gestureLabels';

export interface SliderFallback extends HandSource {
  /**
   * Shows the note being played beside the left–right slider, or nothing. It comes from the mapping, which
   * holds the note lane across small slider steps, so the name always matches what plays.
   */
  showNote(name: string | null): void;
  /** Moves the sliders' hand to the lead side, and the shaping hand to the other, after the roles are swapped. */
  setLeadSide(side: Side): void;
}

interface SliderValues {
  x: number;
  y: number;
  pinch: number;
  pinchMiddle: number;
  gesture: GestureName | null;
  /** The Octave choice: Down, Normal or Up. */
  octave: Octave;
  /** The effect slider, 0..1: the shaping hand's height in the playing zone. */
  effect: number;
}

/** Palm center in the middle, fingers open, no gesture; the normal octave and the preset's own effect amount. */
export const INITIAL_SLIDERS: SliderValues = { x: 0.5, y: 0.5, pinch: 1, pinchMiddle: 1, gesture: null, octave: 0, effect: 0.5 };

/** The sliders' second hand only shapes the sound, so the sliders play one note, as one hand does. */
export const SLIDERS_SECOND_HAND: SecondHand = { mode: 'shape', lastGesture: null };

export function sliderHandState(v: SliderValues, t: number): HandState {
  return {
    present: true,
    palm: { x: v.x, y: v.y },
    pinch: v.pinch,
    pinchMiddle: v.pinchMiddle,
    gesture: v.gesture,
    gestureScore: v.gesture ? 1 : 0,
    t
  };
}

/** The second hand the shape controls stand in for: squeezed on Up, a thumbs-down on Down, as high as the effect slider. */
function shapingHandState(v: SliderValues, t: number): HandState {
  const y = PLAYING_ZONE.end - v.effect * (PLAYING_ZONE.end - PLAYING_ZONE.start);
  const down = v.octave === -1;
  return { present: true, palm: { x: 0.5, y }, pinch: v.octave === 1 ? 0 : 1, pinchMiddle: 1, gesture: down ? 'Thumb_Down' : null, gestureScore: down ? 1 : 0, t };
}

/** The sliders' hand on the lead side, the shaping hand on the other: the sliders always play as the lead hand. */
export function sliderPair(v: SliderValues, lead: Side, t: number): HandPair {
  const played = { state: sliderHandState(v, t), landmarks: null };
  const shaping = { state: shapingHandState(v, t), landmarks: null };
  return lead === 'right' ? { right: played, left: shaping } : { right: shaping, left: played };
}

/** The settings a 0..1 slider sets. */
type SliderKey = Exclude<keyof SliderValues, 'gesture' | 'octave'>;

const SLIDERS: { key: SliderKey; label: string }[] = [
  { key: 'x', label: 'Palm center left–right' },
  { key: 'y', label: 'Palm center up–down' },
  { key: 'pinch', label: 'Pinch (thumb–index)' },
  { key: 'pinchMiddle', label: 'Middle pinch (thumb–middle)' }
];

const OCTAVES: { value: Octave; label: string }[] = [
  { value: -1, label: 'Down' },
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Up' }
];

/** Mounts the controls in their own container inside `root`; stop() removes them. */
export function createSliderFallback(root: HTMLElement, leadSide: Side): SliderFallback {
  let cb: ((pair: HandPair) => void) | null = null;
  let lead = leadSide;
  const values: SliderValues = { ...INITIAL_SLIDERS };
  const container = document.createElement('div');
  container.className = 'sliders grid w-[min(100%,360px)] gap-1.5 rounded-lg bg-bg px-4.5 py-3';
  const note = document.createElement('output');
  note.className = 'font-mono font-semibold text-fg';

  const slider = (key: SliderKey) => {
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min: '0', max: '1', step: '0.01', value: String(values[key]) });
    input.className = 'm-0 h-11 w-full accent-accent';
    input.addEventListener('input', () => {
      values[key] = input.valueAsNumber;
      emit();
    });
    return input;
  };
  for (const { key, label } of SLIDERS) container.append(field(label, slider(key), key === 'x' ? note : undefined));

  const select = document.createElement('select');
  select.className = 'min-h-11 rounded-lg border border-line-strong bg-surface px-2.5 py-0 font-[inherit] text-sm text-fg';
  select.append(new Option('None', ''), ...GESTURE_NAMES.map((name) => new Option(GESTURE_LABELS[name], name)));
  select.addEventListener('input', () => {
    values.gesture = gestureName(select.value);
    emit();
  });
  container.append(field('Gesture', select));

  // Radio buttons in a fieldset: Tab reaches the group, the arrow keys pick within it.
  const octave = document.createElement('fieldset');
  octave.className = 'm-0 flex min-w-0 flex-wrap gap-x-4 border-0 p-0';
  const legend = document.createElement('legend');
  legend.className = 'p-0 text-sm text-muted';
  legend.textContent = 'Octave';
  octave.append(legend);
  for (const { value, label } of OCTAVES) {
    const input = document.createElement('input');
    Object.assign(input, { type: 'radio', name: 'slider-octave', checked: value === values.octave });
    input.className = 'm-0 size-5.5 accent-accent';
    input.addEventListener('input', () => {
      values.octave = value;
      emit();
    });
    const choice = document.createElement('label');
    choice.className = 'flex min-h-11 items-center gap-2 text-sm text-fg';
    choice.append(input, label);
    octave.append(choice);
  }

  container.append(octave, field('Reverb or echo amount', slider('effect')));
  root.append(container);

  function emit() {
    cb?.(sliderPair(values, lead, performance.now()));
  }

  return {
    onState(fn) {
      cb = fn;
      emit();
    },
    stop() {
      cb = null;
      container.remove();
    },
    showNote(name) {
      note.textContent = name ?? '';
    },
    setLeadSide(side) {
      lead = side;
      emit();
    }
  };
}

/** A labelled control; `readout` shows at the end of the caption line. */
function field(text: string, control: HTMLElement, readout?: HTMLElement) {
  const caption = document.createElement('span');
  caption.className = 'flex justify-between';
  caption.append(text);
  if (readout) caption.append(readout);
  const label = document.createElement('label');
  label.className = 'grid text-sm text-muted';
  label.append(caption, control);
  return label;
}
