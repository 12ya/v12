import { useEffect, useRef, useState, type RefObject } from "react";

/** Tracks an element's full content height even while its visible height is clipped. */
export function useMeasuredScrollHeight<T extends HTMLElement>(): {
  readonly ref: RefObject<T | null>;
  readonly height: number | null;
} {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const nextHeight = element.scrollHeight;
      setHeight((current) => (current === nextHeight ? current : nextHeight));
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}
