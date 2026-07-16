import { useEffect, useState } from "react";

export interface AnimatedPresenceState {
  readonly mounted: boolean;
  readonly visible: boolean;
}

/** Keeps content mounted long enough for CSS entrance and exit transitions. */
export function useAnimatedPresence(open: boolean, exitDurationMs = 200): AnimatedPresenceState {
  const [state, setState] = useState<AnimatedPresenceState>(() => ({
    mounted: open,
    visible: false,
  }));

  useEffect(() => {
    if (open) {
      setState((current) => (current.mounted ? current : { mounted: true, visible: false }));
      const frameId = window.requestAnimationFrame(() => {
        setState({ mounted: true, visible: true });
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    setState((current) =>
      current.mounted && current.visible ? { mounted: true, visible: false } : current,
    );
    const timeoutId = window.setTimeout(() => {
      setState({ mounted: false, visible: false });
    }, exitDurationMs);
    return () => window.clearTimeout(timeoutId);
  }, [exitDurationMs, open]);

  return state;
}
