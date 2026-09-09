export const HERO_FRAME_SEQUENCE = {
  // Vite requires import.meta.glob paths to be literal strings, so the matching glob
  // is kept in this same config module. Change frame directory/naming here.
  frameDirectoryLabel: "/assets/pc-frames/",
  framePrefix: "frame_",
  frameExtension: ".png",
  framePadding: 3,
  firstFrame: 1,
  totalFrames: null,
  animationScrollHeight: "520svh",
  mobileAnimationScrollHeight: "560svh",
  initialPreloadCount: 12,
  preloadBehind: 12,
  preloadAhead: 28,
  maxConcurrentLoads: 5,
  nearestFrameSearchRadius: 18,
  frameBlendEnabled: true,
  frameBlendProgressThreshold: 0.01,
  prefetchAllFrames: true,
  prefetchConcurrentLoads: 3,
  prefetchStartDelay: 400,
  decodedFrameCacheLimit: 45,
  introHookAccent: "Where Nature",
  introHookRest: "Slows Time",
  introHookVisibleUntilFrame: 8,
  introHookFadeOutByFrame: 10,
  endFadeFrameCount: 28,
};

export const formatFrameFileName = (frameNumber, config = HERO_FRAME_SEQUENCE) => {
  const paddedNumber = String(frameNumber).padStart(config.framePadding, "0");

  return `${config.framePrefix}${paddedNumber}${config.frameExtension}`;
};

const frameModules = import.meta.glob("../../assets/pc-frames/frame_*.png", {
  eager: true,
  import: "default",
  query: "?url",
});

const getFrameNumber = (path, config = HERO_FRAME_SEQUENCE) => {
  const escapedPrefix = config.framePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedExtension = config.frameExtension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = path.match(new RegExp(`${escapedPrefix}(\\d+)${escapedExtension}$`));

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const discoveredFrames = Object.entries(frameModules)
  .map(([path, url]) => {
    const frameNumber = getFrameNumber(path);

    return {
      frameNumber,
      fileName: formatFrameFileName(frameNumber),
      url,
    };
  })
  .filter((frame) => frame.frameNumber >= HERO_FRAME_SEQUENCE.firstFrame)
  .sort((firstFrame, secondFrame) => firstFrame.frameNumber - secondFrame.frameNumber);

export const heroFrames =
  typeof HERO_FRAME_SEQUENCE.totalFrames === "number"
    ? discoveredFrames.slice(0, HERO_FRAME_SEQUENCE.totalFrames)
    : discoveredFrames;
