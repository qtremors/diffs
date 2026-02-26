// ---------------------------------------------------------------------------
// useScrollSync — synchronized scrolling between two panels
// ---------------------------------------------------------------------------

import { useRef, useCallback } from "react";

export function useScrollSync() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const { scrollTop, scrollLeft } = e.currentTarget;

    if (e.currentTarget === leftRef.current && rightRef.current) {
      rightRef.current.scrollTop = scrollTop;
      rightRef.current.scrollLeft = scrollLeft;
    } else if (e.currentTarget === rightRef.current && leftRef.current) {
      leftRef.current.scrollTop = scrollTop;
      leftRef.current.scrollLeft = scrollLeft;
    }

    // Release the sync lock after the browser settles
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  return { leftRef, rightRef, handleScroll };
}
