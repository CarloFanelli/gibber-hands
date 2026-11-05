import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStored, writeStored } from '../src/ui/storage';

afterEach(() => vi.unstubAllGlobals());

describe('stored values', () => {
  it('reads back what was written', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => saved.get(k) ?? null, setItem: (k: string, v: string) => saved.set(k, v) });
    expect(readStored('preset')).toBeNull();
    writeStored('preset', 'organ');
    expect(readStored('preset')).toBe('organ');
  });

  it('reads nothing and writes nothing, without an error, when storage is blocked', () => {
    const blocked = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
    expect(readStored('preset')).toBeNull();
    expect(() => writeStored('preset', 'organ')).not.toThrow();
  });

  it('reads nothing when the browser offers no storage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readStored('preset')).toBeNull();
  });
});
