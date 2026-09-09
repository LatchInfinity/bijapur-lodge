import { useCallback, useRef } from "react";
import ScrollFrames from "../../components/ScrollFrames/ScrollFrames.jsx";
import { HERO_FRAME_SEQUENCE, heroFrames } from "../../config/frameSequence.config.js";
import "./HeroBanner.css";

const smoothStep = (value) => value * value * (3 - 2 * value);

const getIntroHookOpacity = (frameProgress) => {
  const holdFrame = HERO_FRAME_SEQUENCE.introHookVisibleUntilFrame;
  const fadeEndFrame = HERO_FRAME_SEQUENCE.introHookFadeOutByFrame;

  if (frameProgress <= holdFrame) {
    return 1;
  }

  if (frameProgress >= fadeEndFrame) {
    return 0;
  }

  const fadeProgress = (frameProgress - holdFrame) / (fadeEndFrame - holdFrame);

  return 1 - smoothStep(fadeProgress);
};

const getEndFadeOpacity = (frameProgress, frameCount) => {
  const finalFrame = Math.max(frameCount - 1, 1);
  const fadeStartFrame = Math.max(finalFrame - HERO_FRAME_SEQUENCE.endFadeFrameCount, 0);

  if (frameProgress <= fadeStartFrame) {
    return 0;
  }

  return smoothStep((frameProgress - fadeStartFrame) / (finalFrame - fadeStartFrame));
};

export default function HeroBanner() {
  const heroRef = useRef(null);
  const hookRef = useRef(null);
  const endFadeRef = useRef(null);
  const handleFrameProgressChange = useCallback((frameProgress) => {
    if (hookRef.current) {
      hookRef.current.style.opacity = getIntroHookOpacity(frameProgress);
    }

    if (endFadeRef.current) {
      endFadeRef.current.style.opacity = getEndFadeOpacity(frameProgress, heroFrames.length);
    }
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
          config={HERO_FRAME_SEQUENCE}
          frames={heroFrames}
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
