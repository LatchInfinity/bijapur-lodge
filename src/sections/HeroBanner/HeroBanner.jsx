import { useCallback, useEffect, useState, useRef } from "react";
import ScrollFrames from "../../components/ScrollFrames/ScrollFrames.jsx";
import {
  HERO_FRAME_SEQUENCE,
  HERO_MOBILE_FRAME_SEQUENCE,
  heroFrames,
  heroMobileFrames,
} from "../../config/frameSequence.config.js";
import "./HeroBanner.css";

const smoothStep = (value) => value * value * (3 - 2 * value);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getUsesMobileFrames = () => (
  typeof window !== "undefined"
    && window.matchMedia(HERO_FRAME_SEQUENCE.mobileFrameMediaQuery).matches
);

const getIntroHookOpacity = (frameProgress, config) => {
  const holdFrame = config.introHookVisibleUntilFrame;
  const fadeEndFrame = config.introHookFadeOutByFrame;

  if (frameProgress <= holdFrame) {
    return 1;
  }

  if (frameProgress >= fadeEndFrame) {
    return 0;
  }

  const fadeProgress = (frameProgress - holdFrame) / (fadeEndFrame - holdFrame);

  return 1 - smoothStep(fadeProgress);
};

const getEndFadeOpacity = (frameProgress, frameCount, config) => {
  const finalFrame = Math.max(frameCount - 1, 1);
  const endFadeStartProgress = Number(config.endFadeStartProgress);
  const fadeStartFrame = Number.isFinite(endFadeStartProgress)
    ? finalFrame * clamp(endFadeStartProgress, 0, 0.99)
    : Math.max(finalFrame - config.endFadeFrameCount, 0);

  if (frameProgress <= fadeStartFrame) {
    return 0;
  }

  return smoothStep((frameProgress - fadeStartFrame) / Math.max(finalFrame - fadeStartFrame, 0.001));
};

export default function HeroBanner() {
  const heroRef = useRef(null);
  const hookRef = useRef(null);
  const endFadeRef = useRef(null);
  const [usesMobileFrames, setUsesMobileFrames] = useState(getUsesMobileFrames);
  const hasMobileFrames = heroMobileFrames.length > 0;
  const activeFrameSet = usesMobileFrames && hasMobileFrames ? "mobile" : "desktop";
  const activeConfig = activeFrameSet === "mobile" ? HERO_MOBILE_FRAME_SEQUENCE : HERO_FRAME_SEQUENCE;
  const activeFrames = activeFrameSet === "mobile" ? heroMobileFrames : heroFrames;

  const handleFrameProgressChange = useCallback((frameProgress) => {
    if (hookRef.current) {
      hookRef.current.style.opacity = getIntroHookOpacity(frameProgress, activeConfig);
    }

    if (endFadeRef.current) {
      endFadeRef.current.style.opacity = getEndFadeOpacity(
        frameProgress,
        activeFrames.length,
        activeConfig,
      );
    }
  }, [activeConfig, activeFrames.length]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(HERO_FRAME_SEQUENCE.mobileFrameMediaQuery);
    const updateFrameSet = () => setUsesMobileFrames(mediaQueryList.matches);

    updateFrameSet();
    mediaQueryList.addEventListener("change", updateFrameSet);

    return () => mediaQueryList.removeEventListener("change", updateFrameSet);
  }, []);

  return (
    <section
      className="hero-banner"
      id="hero"
      ref={heroRef}
      style={{
        "--hero-scroll-height": HERO_FRAME_SEQUENCE.animationScrollHeight,
        "--hero-scroll-height-mobile": HERO_FRAME_SEQUENCE.mobileAnimationScrollHeight,
      }}
      aria-labelledby="hero-heading"
    >
      <h1 className="sr-only" id="hero-heading">
        Bijapur Lodge
      </h1>
      <div className="hero-banner__sticky">
        <ScrollFrames
          key={activeFrameSet}
          config={activeConfig}
          frames={activeFrames}
          onFrameProgressChange={handleFrameProgressChange}
          scrollContainerRef={heroRef}
        />
        <div
          ref={hookRef}
          className="hero-banner__hook"
        >
          <p>
            <em>{HERO_FRAME_SEQUENCE.introHookAccent}</em>
            {" "}
            <span>{HERO_FRAME_SEQUENCE.introHookRest}</span>
          </p>
        </div>
        <div ref={endFadeRef} className="hero-banner__end-fade" />
      </div>
    </section>
  );
}
