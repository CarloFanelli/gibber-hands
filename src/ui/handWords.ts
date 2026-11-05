/** How the page names each hand: by the player's side, as the player sees it. */
import type { Side } from '../hands/types';
import { otherSide } from '../mapping/roles';

export const SIDE_NAME: Record<Side, string> = { right: 'Right', left: 'Left' };

/** Names each `data-hand` span inside `root` by its side: "lead" the lead hand's, "second" the other's. */
export function nameHands(root: ParentNode, lead: Side): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-hand]')) {
    el.textContent = SIDE_NAME[el.dataset.hand === 'lead' ? lead : otherSide(lead)];
  }
}
