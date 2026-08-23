"use client";

import * as React from "react";

/**
 * Animated number that counts up from 0 to `value` over `duration` ms.
 * Re-animates when `value` changes significantly.
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  className,
  format,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (v: number) => string;
}) {
  const [display, setDisplay] = React.useState(0);
  const prevRef = React.useRef(0);

  React.useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = format ? format(display) : Math.round(display).toString();
  return <span className={className}>{formatted}</span>;
}
