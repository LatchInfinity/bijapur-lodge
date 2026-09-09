const upscaledVideoUrl = `${import.meta.env.BASE_URL}media/upscaled-video-scrub-intra.mp4`;

export const HERO_SCROLL_VIDEO = {
  src: upscaledVideoUrl,
  type: "video/mp4",
  preload: "auto",
  useBlobSource: true,
  animationScrollHeight: "520svh",
  mobileAnimationScrollHeight: "560svh",
  targetFrameRate: 29.97,
  seekEpsilon: 0.001,
  seekThrottleMs: 0,
  endSnapProgress: 0.985,
  introHookAccent: "Where Nature",
  introHookRest: "Slows Time",
  introHookVisibleUntilProgress: 0.13,
  introHookFadeOutByProgress: 0.18,
  endFadeStartProgress: 0.94,
};
