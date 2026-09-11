import { useEffect, useState } from 'react';

// Implements BRD UIR-013: a live, continuously-updating countdown computed from a fixed
// target timestamp (Architecture §8 — ticks client-side off the server-provided target,
// independent of the data-refetch interval that supplies that target).

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export interface CountdownClockProps {
  /** The deadline this clock counts down to. */
  target: Date;
  /** "hms" for roster-lock-style HH:MM:SS (UIR-043); "ms" for draft-pick-style MM:SS (UIR-101). */
  format?: 'hms' | 'ms';
}

export function CountdownClock({ target, format = 'hms' }: CountdownClockProps) {
  const [remainingMs, setRemainingMs] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, target.getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const display =
    format === 'hms' ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <span className="tabular" role="timer" aria-live="off">
      {display}
    </span>
  );
}
