const heroMediaBaseUrl = `${import.meta.env.BASE_URL}media/`;
const previewVideoUrl = `${heroMediaBaseUrl}upscaled-video-scrub-preview.mp4`;
const enhancedVideoUrl = `${heroMediaBaseUrl}upscaled-video-scrub.webm`;
const mobilePreviewVideoUrl = `${heroMediaBaseUrl}upscaled-video-scrub-mobile-preview.mp4`;
const mobileEnhancedVideoUrl = `${heroMediaBaseUrl}upscaled-video-scrub-mobile.webm`;

export const HERO_SCROLL_VIDEO = {
  src: previewVideoUrl,
  type: "video/mp4",
  fallbackSrc: previewVideoUrl,
  fallbackType: "video/mp4",
  enhancedSrc: enhancedVideoUrl,
  enhancedType: 'video/webm; codecs="vp9"',
  mobileMediaQuery: "(max-width: 767px)",
  mobileFallbackSrc: mobilePreviewVideoUrl,
  mobileFallbackType: "video/mp4",
  mobileEnhancedSrc: mobileEnhancedVideoUrl,
  mobileEnhancedType: 'video/webm; codecs="vp9"',
  upgradeToEnhancedSource: true,
  enhancedStartDelay: 650,
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
