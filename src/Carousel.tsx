import React, { useCallback, useEffect, useRef, useState } from "react";

type CarouselProps = {
  slideCount: number;
  accent: string;
  resetKey: string | number;
  initialSlide?: number;
  onSlideChange?: (i: number) => void;
  children: React.ReactNode;
};

export const Carousel: React.FC<CarouselProps> = ({
  slideCount,
  accent,
  resetKey,
  initialSlide = 0,
  onSlideChange,
  children,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(initialSlide);

  // Keep latest values in refs so consumers don't need to memoize callbacks
  // and changing initialSlide mid-episode doesn't cause unwanted scrolls.
  const initialSlideRef = useRef(initialSlide);
  useEffect(() => { initialSlideRef.current = initialSlide; }, [initialSlide]);

  const onSlideChangeRef = useRef(onSlideChange);
  useEffect(() => { onSlideChangeRef.current = onSlideChange; }, [onSlideChange]);

  // Notify parent when current changes.
  useEffect(() => {
    onSlideChangeRef.current?.(current);
  }, [current]);

  const goTo = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track) return;
      const target = Math.max(0, Math.min(slideCount - 1, i));
      track.scrollTo({ left: target * track.clientWidth, behavior });
    },
    [slideCount],
  );

  // Track which slide is centered as the user scrolls/swipes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = track.clientWidth;
        if (!w) return;
        const idx = Math.round(track.scrollLeft / w);
        setCurrent((prev) => (prev === idx ? prev : idx));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // On episode change, jump to the saved (or default) starting slide.
  useEffect(() => {
    const target = initialSlideRef.current ?? 0;
    goTo(target, "auto");
    setCurrent(target);
  }, [resetKey, goTo]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  return (
    <div className="carousel">
      <div className="carousel-track" ref={trackRef}>
        {children}
      </div>

      <div className="carousel-controls">
        <button
          className="carousel-btn"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          aria-label="Previous slide"
        >‹</button>

        <div className="carousel-dots">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              className={"dot" + (i === current ? " active" : "")}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={i === current ? { background: accent } : undefined}
            />
          ))}
        </div>

        <button
          className="carousel-btn"
          onClick={() => goTo(current + 1)}
          disabled={current >= slideCount - 1}
          aria-label="Next slide"
        >›</button>
      </div>
    </div>
  );
};
