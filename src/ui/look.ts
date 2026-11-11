/**
 * Class lists shared by many controls, written out in full so Tailwind finds them. Each control adds its own
 * place and text size: under them sit the browser's own button styles (styles.css), and the font shorthand
 * that would inherit the size too sorts after the size utilities and undoes them.
 */

/** A button drawn as an outline on the panel's colour: Help, Left-handed, Copy, the drum buttons, Close. Hovered,
 * its border brightens; pressed, it darkens; disabled, neither. */
export const OUTLINED =
  'min-h-11 cursor-pointer rounded-lg border border-line-strong bg-transparent font-[inherit] text-fg not-disabled:hover:border-line-hover not-disabled:active:bg-bg';

/** A button filled with the accent: Start audio, Try again. It keeps the browser's button font. Hovered, it
 * lightens; pressed, it darkens; disabled or starting, neither. */
export const FILLED =
  'min-h-11 cursor-pointer rounded-lg border-0 bg-accent text-sm font-semibold text-accent-ink not-disabled:not-aria-disabled:hover:bg-accent-hover not-disabled:not-aria-disabled:active:brightness-90';
