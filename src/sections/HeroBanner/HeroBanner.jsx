import { useCallback, useRef } from "react";
import ScrollVideo from "../../components/ScrollVideo/ScrollVideo.jsx";
import { HERO_SCROLL_VIDEO } from "../../config/heroVideo.config.js";
import "./HeroBanner.css";

const smoothStep = (value) => value * value * (3 - 2 * value);

const getIntroHookOpacity = (progress) => {
  const holdProgress = HERO_SCROLL_VIDEO.introHookVisibleUntilProgress;
  const fadeEndProgress = HERO_SCROLL_VIDEO.introHookFadeOutByProgress;

  if (progress <= holdProgress) {
    return 1;
  }

  if (progress >= fadeEndProgress) {
    return 0;
  }

  const fadeProgress = (progress - holdProgress) / (fadeEndProgress - holdProgress);

  return 1 - smoothStep(fadeProgress);
};

const getEndFadeOpacity = (progress) => {
  const fadeStartProgress = HERO_SCROLL_VIDEO.endFadeStartProgress;

  if (progress <= fadeStartProgress) {
    return 0;
  }

  return smoothStep((progress - fadeStartProgress) / (1 - fadeStartProgress));
};

export default function HeroBanner() {
  const heroRef = useRef(null);
  const hookRef = useRef(null);
  const endFadeRef = useRef(null);
  const handleVideoProgressChange = useCallback((progress) => {
    if (hookRef.current) {
      hookRef.current.style.opacity = getIntroHookOpacity(progress);
    }

    if (endFadeRef.current) {
      endFadeRef.current.style.opacity = getEndFadeOpacity(progress);
    }
  }, []);

  return (
    <section
      className="hero-banner"
      id="hero"
      ref={heroRef}
      style={{
        "--hero-scroll-height": HERO_SCROLL_VIDEO.animationScrollHeight,
        "--hero-scroll-height-mobile": HERO_SCROLL_VIDEO.mobileAnimationScrollHeight,
      }}
      aria-labelledby="hero-heading"
    >
      <h1 className="sr-only" id="hero-heading">
        Bijapur Lodge
      </h1>
      <div className="hero-banner__sticky">
        <ScrollVideo
          config={HERO_SCROLL_VIDEO}
          onProgressChange={handleVideoProgressChange}
          scrollContainerRef={heroRef}
        />
        <div
          ref={hookRef}
          className="hero-banner__hook"
        >
          <p>
            <em>{HERO_SCROLL_VIDEO.introHookAccent}</em>
            {" "}
            <span>{HERO_SCROLL_VIDEO.introHookRest}</span>
          </p>
        </div>
        <div ref={endFadeRef} className="hero-banner__end-fade" />
      </div>
    </section>
  );
}
