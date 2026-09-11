import { useCallback, useEffect, useRef } from "react";
import {
  LODGE_GALLERY_CONFIG,
  lodgeImages,
} from "../../config/lodgeGallery.config.js";
import "./LodgeShowcase.css";

const canUseHoverAutoScroll = () => (
  typeof window !== "undefined"
  && window.matchMedia("(hover: hover) and (pointer: fine)").matches
);

export default function LodgeShowcase() {
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const isTouchInteractionRef = useRef(false);
  const touchResetTimerRef = useRef(null);

  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    lastFrameTimeRef.current = 0;
  }, []);

  const runAutoScroll = useCallback((timestamp) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      stopAutoScroll();
      return;
    }

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

    if (maxScrollLeft <= 0) {
      stopAutoScroll();
      return;
    }

    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const elapsedSeconds = (timestamp - lastFrameTimeRef.current) / 1000;
    const nextScrollLeft = viewport.scrollLeft + LODGE_GALLERY_CONFIG.autoScrollSpeed * elapsedSeconds;

    viewport.scrollLeft = nextScrollLeft >= maxScrollLeft ? 0 : nextScrollLeft;
    lastFrameTimeRef.current = timestamp;
    animationFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }, [runAutoScroll]);

  const handleAutoScrollStart = useCallback(() => {
    if (isTouchInteractionRef.current || !canUseHoverAutoScroll()) {
      return;
    }

    startAutoScroll();
  }, [startAutoScroll]);

  const pauseTouchAutoScroll = useCallback(() => {
    isTouchInteractionRef.current = true;
    stopAutoScroll();
    window.clearTimeout(touchResetTimerRef.current);

    touchResetTimerRef.current = window.setTimeout(() => {
      isTouchInteractionRef.current = false;
    }, 400);
  }, [stopAutoScroll]);

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      pauseTouchAutoScroll();
    }
  }, [pauseTouchAutoScroll]);

  useEffect(() => () => {
    stopAutoScroll();
    window.clearTimeout(touchResetTimerRef.current);
  }, [stopAutoScroll]);

  return (
    <section
      className="lodge-showcase"
      id="lodges"
      aria-labelledby="lodge-showcase-heading"
    >
      <div className="lodge-showcase__header page-gutter">
        <p id="lodge-showcase-heading">{LODGE_GALLERY_CONFIG.sectionLabel}</p>
      </div>

      <div
        className="lodge-showcase__viewport"
        ref={viewportRef}
        onMouseEnter={handleAutoScrollStart}
        onMouseLeave={stopAutoScroll}
        onFocus={handleAutoScrollStart}
        onBlur={stopAutoScroll}
        onPointerDown={handlePointerDown}
        onTouchStart={pauseTouchAutoScroll}
        tabIndex={0}
        aria-label="Bijapur Lodge views gallery"
      >
        <div className="lodge-showcase__track">
          {lodgeImages.map((image) => (
            <article
              className="lodge-showcase__card"
              key={image.id}
            >
              <img
                className="lodge-showcase__image"
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
