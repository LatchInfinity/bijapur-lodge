import { useCallback, useEffect, useRef } from "react";
import {
  LODGE_GALLERY_CONFIG,
  lodgeImages,
} from "../../config/lodgeGallery.config.js";
import "./LodgeShowcase.css";

const PC_GALLERY_QUERY = "(min-width: 1024px)";

export default function LodgeShowcase() {
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const scrollDirectionRef = useRef(1);
  const isTouchInteractionRef = useRef(false);
  const touchResetTimerRef = useRef(null);
  const isHoveringRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isPcRef = useRef(false);

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
    let nextScrollLeft = viewport.scrollLeft + scrollDirectionRef.current * LODGE_GALLERY_CONFIG.autoScrollSpeed * elapsedSeconds;

    if (nextScrollLeft >= maxScrollLeft) {
      nextScrollLeft = maxScrollLeft;
      scrollDirectionRef.current = -1;
    } else if (nextScrollLeft <= 0) {
      nextScrollLeft = 0;
      scrollDirectionRef.current = 1;
    }

    viewport.scrollLeft = nextScrollLeft;
    lastFrameTimeRef.current = timestamp;
    animationFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }, [runAutoScroll]);

  const updateAutoScroll = useCallback(() => {
    if (!viewportRef.current || !isVisibleRef.current || isTouchInteractionRef.current) {
      stopAutoScroll();
      return;
    }

    const wantsRun = isPcRef.current ? !isHoveringRef.current : isHoveringRef.current;

    if (wantsRun) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  }, [startAutoScroll, stopAutoScroll]);

  const handleHoverStart = useCallback(() => {
    isHoveringRef.current = true;
    updateAutoScroll();
  }, [updateAutoScroll]);

  const handleHoverStop = useCallback(() => {
    isHoveringRef.current = false;
    updateAutoScroll();
  }, [updateAutoScroll]);

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

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || typeof window === "undefined") {
      return undefined;
    }

    const pcQuery = window.matchMedia(PC_GALLERY_QUERY);
    const syncPcMode = () => {
      isPcRef.current = pcQuery.matches;
      updateAutoScroll();
    };

    syncPcMode();

    if (typeof pcQuery.addEventListener === "function") {
      pcQuery.addEventListener("change", syncPcMode);
    } else if (typeof pcQuery.addListener === "function") {
      pcQuery.addListener(syncPcMode);
    }

    const visibilityObserver = new window.IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries.some((entry) => entry.isIntersecting);
        updateAutoScroll();
      },
      { threshold: 0.1 }
    );

    visibilityObserver.observe(viewport);

    return () => {
      visibilityObserver.disconnect();

      if (typeof pcQuery.removeEventListener === "function") {
        pcQuery.removeEventListener("change", syncPcMode);
      } else if (typeof pcQuery.removeListener === "function") {
        pcQuery.removeListener(syncPcMode);
      }
    };
  }, [updateAutoScroll]);

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
        <p id="lodge-showcase-heading" className="lodge-showcase__title">{LODGE_GALLERY_CONFIG.sectionLabel}</p>
        <p className="lodge-showcase__intro">{LODGE_GALLERY_CONFIG.sectionIntro}</p>
      </div>

      <div
        className="lodge-showcase__viewport"
        ref={viewportRef}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverStop}
        onFocus={handleHoverStart}
        onBlur={handleHoverStop}
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
                onLoad={updateAutoScroll}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
