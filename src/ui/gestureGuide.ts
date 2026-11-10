/**
 * The gesture guide: every gesture and what it does, in the side panel's Gestures tab. It names the hands
 * by their current roles; while the sliders stand in for the hand, a first line says so. The help sheet
 * stays the full reference, keys included.
 */
import type { Side } from '../hands/types';
import { nameHands } from './handWords';

export interface GestureGuide {
  /** Names the hands after the roles are swapped. */
  setLeadSide(side: Side): void;
  /** Shows the line about the sliders while they stand in for the hand. */
  showSliders(shown: boolean): void;
}

const CONTENT = `
  <p class="guide-sliders" hidden>Sliders: they stand in for your hand while the camera can’t track it.</p>
  <p><span data-hand="lead"></span> hand: the lead hand. <span data-hand="second"></span> hand: the second hand.</p>
  <dl>
    <dt>Palm center left or right</dt><dd>Picks the note, one note lane each; a wider camera picture gives more lanes</dd>
    <dt>Palm center up or down</dt><dd>Brighter or darker</dd>
    <dt>Thumb and index squeezed</dt><dd>Plays the note: the closer, the louder</dd>
    <dt>Closed fist</dt><dd>Silence</dd>
    <dt><span data-hand="second"></span> hand: Victory sign ✌</dt><dd>Switches it between playing notes and shape mode</dd>
    <dt>Shape mode: squeeze held</dt><dd>Every note one octave up</dd>
    <dt>Shape mode: thumbs-down held 👎</dt><dd>Every note one octave down</dd>
    <dt>Shape mode: hand up or down</dt><dd>More or less reverb or echo</dd>
  </dl>
`;

export function createGestureGuide(root: HTMLElement, leadSide: Side): GestureGuide {
  root.innerHTML = CONTENT;
  const sliders = root.querySelector<HTMLElement>('.guide-sliders')!;
  nameHands(root, leadSide);
  return {
    setLeadSide: (side) => nameHands(root, side),
    showSliders(shown) {
      sliders.hidden = !shown;
    }
  };
}
