/**
 * The side panel: the live code and the gesture guide as two tabs, one shown at a time at the panel's full
 * height. Its collapse button, or the C key (ui/shortcuts), folds it into a narrow strip with an expand
 * button; the camera then takes its room. Which tab shows and whether it is open are remembered; its width
 * is Resizer's (ui/layout).
 */
import { readStored, writeStored } from './storage';

export type SideTab = 'code' | 'gestures';

export interface SidePanelState {
  open: boolean;
  tab: SideTab;
}

/** Browser storage key of the side panel's open state and tab. */
const SIDE_PANEL_KEY = 'gibber-hands-side-panel';
const FIRST_VISIT: SidePanelState = { open: true, tab: 'code' };
const TAB_NAME: Record<SideTab, string> = { code: 'Code', gestures: 'Gestures' };

/** The saved state; open on the Code tab when nothing readable is saved. */
export function savedSidePanel(stored: string | null): SidePanelState {
  try {
    const value: unknown = JSON.parse(stored ?? 'null');
    if (typeof value === 'object' && value !== null && 'open' in value && 'tab' in value) {
      const { open, tab } = value;
      if (typeof open === 'boolean' && (tab === 'code' || tab === 'gestures')) return { open, tab };
    }
  } catch {
    // Not JSON: the same as nothing saved.
  }
  return { ...FIRST_VISIT };
}

export function storedSidePanel(state: SidePanelState): string {
  return JSON.stringify(state);
}

export interface SidePanel {
  /** Collapses the panel, or expands it if it is collapsed. */
  toggle(): void;
}

/**
 * Fills `panel` with the tabs, `code` and `guide` becoming their contents, and `strip`, shown in the panel's
 * place while it is collapsed. Collapsing adds `hiddenClass` to the panel, the class Resizer leaves out of the row.
 */
export function createSidePanel(panel: HTMLElement, strip: HTMLElement, code: HTMLElement, guide: HTMLElement, hiddenClass: string): SidePanel {
  const parts: Record<SideTab, HTMLElement> = { code, gestures: guide };
  const bar = document.createElement('div');
  bar.className = 'side-tabs';
  const tablist = document.createElement('div');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Side panel');
  const tabs = {} as Record<SideTab, HTMLButtonElement>;
  for (const tab of ['code', 'gestures'] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'side-tab';
    button.id = `side-tab-${tab}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', parts[tab].id);
    button.textContent = TAB_NAME[tab];
    button.addEventListener('click', () => show({ ...state, tab }));
    parts[tab].setAttribute('role', 'tabpanel');
    parts[tab].setAttribute('aria-labelledby', button.id);
    tabs[tab] = button;
    tablist.append(button);
  }
  // Arrow keys move between the two tabs, as in any tab list.
  tablist.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const tab = state.tab === 'code' ? 'gestures' : 'code';
    show({ ...state, tab });
    tabs[tab].focus();
  });
  const collapse = document.createElement('button');
  collapse.type = 'button';
  collapse.className = 'side-collapse';
  collapse.setAttribute('aria-label', 'Collapse side panel');
  collapse.textContent = '❯';
  bar.append(tablist, collapse);
  panel.prepend(bar);

  const expand = document.createElement('button');
  expand.type = 'button';
  expand.className = 'side-expand';
  expand.setAttribute('aria-label', 'Expand side panel');
  strip.append(expand);

  let state = savedSidePanel(readStored(SIDE_PANEL_KEY));
  function show(next: SidePanelState) {
    // Collapsing from a control inside the panel would drop focus to the page: it goes to the expand button.
    const refocus = !next.open && panel.contains(document.activeElement);
    state = next;
    writeStored(SIDE_PANEL_KEY, storedSidePanel(next));
    panel.classList.toggle(hiddenClass, !next.open);
    strip.hidden = next.open;
    for (const tab of ['code', 'gestures'] as const) {
      const selected = tab === next.tab;
      tabs[tab].setAttribute('aria-selected', String(selected));
      tabs[tab].tabIndex = selected ? 0 : -1;
      parts[tab].hidden = !selected;
    }
    expand.textContent = `❮ ${TAB_NAME[next.tab]}`;
    if (refocus) expand.focus();
  }
  collapse.addEventListener('click', () => show({ ...state, open: false }));
  expand.addEventListener('click', () => {
    show({ ...state, open: true });
    tabs[state.tab].focus();
  });
  show(state);

  return { toggle: () => show({ ...state, open: !state.open }) };
}
