/**
 * The top bar's swap control for left-handed players: pressed, the left hand is the lead hand
 * and the right hand the second hand.
 */
import type { Side } from '../hands/types';
import { OUTLINED } from './look';

export function createLeadHandSwitch(root: HTMLElement, lead: Side, onChange: (lead: Side) => void): void {
  let current = lead;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `lead-hand ${OUTLINED} self-start px-3.5 py-2.5 text-base aria-pressed:border-accent aria-pressed:bg-accent/12 @max-[480px]/top-bar:px-2`;
  button.textContent = 'Left-handed';
  button.title = 'Swap the hands: your left hand becomes the lead hand, which always plays notes. Remembered for your next visit';
  const show = () => button.setAttribute('aria-pressed', String(current === 'left'));
  show();
  button.addEventListener('click', () => {
    current = current === 'left' ? 'right' : 'left';
    show();
    onChange(current);
  });
  root.append(button);
}
