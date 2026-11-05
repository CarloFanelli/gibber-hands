/**
 * Browser storage that may be blocked (private mode, site data disabled): reading gives null and writing
 * does nothing, so the page works the same and just doesn't remember.
 */

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered this time.
  }
}
