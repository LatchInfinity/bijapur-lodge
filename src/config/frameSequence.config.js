export const HERO_FRAME_SEQUENCE = {
  // Vite requires import.meta.glob paths to be literal strings, so the matching glob
  // is kept in this same config module. Change frame directory/naming here.
  frameDirectoryLabel: "/assets/pc-frames/",
  framePrefix: "frame_",
  frameExtension: ".jpg",
  frameExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  framePadding: 3,
  firstFrame: 1,
  totalFrames: null,
  animationScrollHeight: "520svh",
  mobileAnimationScrollHeight: "560svh",
  initialPreloadCount: 1,
  preloadHeadFrameCount: 3,
  preloadBehind: 12,
  preloadAhead: 28,
  prefetchPriorityBehind: 8,
  prefetchPriorityAhead: 36,
  maxConcurrentLoads: 5,
  nearestFrameSearchRadius: 18,
  frameBlendEnabled: true,
  frameBlendProgressThreshold: 0.01,
  prefetchAllFrames: true,
  prefetchConcurrentLoads: 4,
  prefetchStartDelay: 120,
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

const frameModules = {
  ...import.meta.glob("../../assets/pc-frames/frame_*.jpg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/pc-frames/frame_*.jpeg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/pc-frames/frame_*.png", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/pc-frames/frame_*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
};

const getFrameExtensionPattern = (config = HERO_FRAME_SEQUENCE) => {
  const extensions = config.frameExtensions?.length
    ? config.frameExtensions
    : [config.frameExtension];

  return extensions
    .map((extension) => extension.replace(/^\./, ""))
    .map((extension) => extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
};

const getFrameNumber = (path, config = HERO_FRAME_SEQUENCE) => {
  const escapedPrefix = config.framePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const extensionPattern = getFrameExtensionPattern(config);
  const match = path.match(new RegExp(`${escapedPrefix}(\\d+)\\.(${extensionPattern})$`, "i"));

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const getFrameFileName = (path, frameNumber) => {
  const fileExtension = path.match(/\.[a-z0-9]+$/i)?.[0] || HERO_FRAME_SEQUENCE.frameExtension;
  const paddedNumber = String(frameNumber).padStart(HERO_FRAME_SEQUENCE.framePadding, "0");

  return `${HERO_FRAME_SEQUENCE.framePrefix}${paddedNumber}${fileExtension}`;
};

const discoveredFrames = Object.entries(frameModules)
  .map(([path, url]) => {
    const frameNumber = getFrameNumber(path);

    return {
      frameNumber,
      fileName: getFrameFileName(path, frameNumber),
      url,
    };
  })
  .filter((frame) => frame.frameNumber >= HERO_FRAME_SEQUENCE.firstFrame)
  .sort((firstFrame, secondFrame) => firstFrame.frameNumber - secondFrame.frameNumber);

export const heroFrames =
  typeof HERO_FRAME_SEQUENCE.totalFrames === "number"
    ? discoveredFrames.slice(0, HERO_FRAME_SEQUENCE.totalFrames)
    : discoveredFrames;
