import { useState, useRef, useCallback, useEffect } from "react";

export function useInfiniteList<T>(items: T[], pageSize: number) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemsLengthRef = useRef(items.length);
  const pageSizeRef = useRef(pageSize);
  itemsLengthRef.current = items.length;
  pageSizeRef.current = pageSize;

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  // Callback ref instead of useRef + a dependency-gated effect: the sentinel
  // <div> is only rendered while hasMore is true, so it can unmount and
  // remount (a new DOM node) whenever a sort/search/filter change recomputes
  // the list without changing its length — an effect keyed on [items.length,
  // pageSize] would miss that remount and keep observing a detached node,
  // silently freezing pagination. A callback ref re-attaches on every mount.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) => Math.min(count + pageSizeRef.current, itemsLengthRef.current));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return {
    visibleItems: items.slice(0, visibleCount),
    sentinelRef,
    hasMore: visibleCount < items.length,
  };
}
