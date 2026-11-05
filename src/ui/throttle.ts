/**
 * Passes values on to `fn` at most once per `ms`: the first at once, then the latest one at the end of
 * each period. The last value always arrives, at most `ms` late.
 */
export function throttle<T>(fn: (value: T) => void, ms: number): (value: T) => void {
  let periodRunning = false;
  let pending: { value: T } | null = null;

  function endPeriod() {
    if (pending === null) {
      periodRunning = false;
      return;
    }
    fn(pending.value);
    pending = null;
    setTimeout(endPeriod, ms);
  }

  return (value) => {
    if (periodRunning) {
      pending = { value };
      return;
    }
    fn(value);
    periodRunning = true;
    setTimeout(endPeriod, ms);
  };
}
