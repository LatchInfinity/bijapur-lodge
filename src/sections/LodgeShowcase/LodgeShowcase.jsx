import { useCallback, useEffect, useRef } from "react";
import {
  LODGE_GALLERY_CONFIG,
  lodgeImages,
} from "../../config/lodgeGallery.config.js";
import "./LodgeShowcase.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function LodgeShowcase() {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const isTickingRef = useRef(false);

  const updateTrackPosition = useCallback(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!section || !viewport || !track) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / scrollableDistance, 0, 1);
    const horizontalDistance = Math.max(track.scrollWidth - viewport.clientWidth, 0);

    track.style.transform = `translate3d(${-horizontalDistance * progress}px, 0, 0)`;
  }, []);

  const queueTrackUpdate = useCallback(() => {
    if (isTickingRef.current) {
      return;
    }

    isTickingRef.current = true;
    window.requestAnimationFrame(() => {
      updateTrackPosition();
      isTickingRef.current = false;
    });
  }, [updateTrackPosition]);

  useEffect(() => {
    updateTrackPosition();

    window.addEventListener("scroll", queueTrackUpdate, { passive: true });
    window.addEventListener("resize", queueTrackUpdate);

    return () => {
      window.removeEventListener("scroll", queueTrackUpdate);
      window.removeEventListener("resize", queueTrackUpdate);
    };
  }, [queueTrackUpdate, updateTrackPosition]);

  return (
    <section
      className="lodge-showcase"
      id="lodges"
      ref={sectionRef}
      style={{
        "--lodge-showcase-height": LODGE_GALLERY_CONFIG.scrollHeight,
        "--lodge-showcase-height-mobile": LODGE_GALLERY_CONFIG.mobileScrollHeight,
      }}
    >
      <div className="lodge-showcase__sticky">
        <div className="lodge-showcase__header page-gutter">
          <p>{LODGE_GALLERY_CONFIG.sectionLabel}</p>
        </div>

        <div className="lodge-showcase__viewport" ref={viewportRef}>
          <div className="lodge-showcase__track" ref={trackRef}>
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
      </div>
    </section>
  );
}
