/**
 * In a window narrower than 720 px, the sounds panel and the side panel are bottom sheets: a bottom bar's two
 * buttons open one at a time over the camera, and its × button, a tap on the camera or the other button
 * closes it. Crossing 720 px either way closes the open sheet. Wider, the bottom bar is hidden and nothing
 * here acts. Which sheet is open is the `data-sheet` attribute of `app` (styles.css).
 */

/** The window width below which the panels are bottom sheets; styles.css uses the same width. */
export const NARROW_QUERY = '(max-width: 719.98px)';

export type Sheet = 'sounds' | 'side';

const SHEET_NAME: Record<Sheet, string> = { sounds: 'Sounds', side: 'Code & gestures' };

export interface BottomSheets {
  /** Opens `sheet`, or closes it if it is open, in a narrow window only; says whether the window is narrow. */
  toggle(sheet: Sheet): boolean;
  /** Opens `sheet` in a narrow window only; says whether the window is narrow. */
  open(sheet: Sheet): boolean;
}

/** `panels` are the sounds panel and the side panel; `stage` is the camera view, a tap on which closes the sheet. */
export function createBottomSheets(app: HTMLElement, stage: HTMLElement, panels: Record<Sheet, HTMLElement>): BottomSheets {
  const narrow = matchMedia(NARROW_QUERY);
  const bar = document.createElement('nav');
  bar.className = 'bottom-bar';
  bar.setAttribute('aria-label', 'Panels');
  const buttons = {} as Record<Sheet, HTMLButtonElement>;
  for (const sheet of ['sounds', 'side'] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bottom-button';
    button.textContent = SHEET_NAME[sheet];
    button.addEventListener('click', () => toggle(sheet));
    buttons[sheet] = button;
    bar.append(button);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'sheet-close';
    close.setAttribute('aria-label', `Close ${SHEET_NAME[sheet]}`);
    close.textContent = '×';
    close.addEventListener('click', () => show(null));
    panels[sheet].prepend(close);
  }
  app.append(bar);

  let open: Sheet | null = null;
  function show(sheet: Sheet | null) {
    // Closing from a control inside the sheet would drop focus to the page: it goes to the sheet's button.
    if (open && sheet !== open && panels[open].contains(document.activeElement)) buttons[open].focus();
    open = sheet;
    if (sheet) app.dataset.sheet = sheet;
    else delete app.dataset.sheet;
    for (const s of ['sounds', 'side'] as const) buttons[s].setAttribute('aria-expanded', String(s === sheet));
  }
  function toggle(sheet: Sheet) {
    if (!narrow.matches) return false;
    show(open === sheet ? null : sheet);
    return true;
  }

  // The sounds sheet sits inside the camera view: a tap there is not a tap on the camera.
  stage.addEventListener('click', (e) => {
    if (open && !(e.target instanceof Node && panels[open].contains(e.target))) show(null);
  });
  narrow.addEventListener('change', () => show(null));
  show(null);

  return {
    toggle,
    open(sheet) {
      if (!narrow.matches) return false;
      show(sheet);
      return true;
    }
  };
}
