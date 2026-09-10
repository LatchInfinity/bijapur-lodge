const PC_FRAME_DIRECTORY_LABEL = "/assets/pc-frames/";
const MOBILE_FRAME_DIRECTORY_LABEL = "/assets/mobile-frames/";
const MOBILE_FRAME_MEDIA_QUERY = "(max-width: 640px)";

export const HERO_FRAME_SEQUENCE = {
  // Vite requires import.meta.glob paths to be literal strings, so the matching glob
  // is kept in this same config module. Change frame directory/naming here.
  frameDirectoryLabel: PC_FRAME_DIRECTORY_LABEL,
  mobileFrameDirectoryLabel: MOBILE_FRAME_DIRECTORY_LABEL,
  mobileFrameMediaQuery: MOBILE_FRAME_MEDIA_QUERY,
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
  introHookVisibleUntilFrame: 0,
  introHookFadeOutByFrame: 1,
  endFadeStartProgress: 0.92,
  endFadeFrameCount: 28,
};

export const HERO_MOBILE_FRAME_SEQUENCE = {
  ...HERO_FRAME_SEQUENCE,
  frameDirectoryLabel: MOBILE_FRAME_DIRECTORY_LABEL,
};

export const formatFrameFileName = (frameNumber, config = HERO_FRAME_SEQUENCE) => {
  const paddedNumber = String(frameNumber).padStart(config.framePadding, "0");

  return `${config.framePrefix}${paddedNumber}${config.frameExtension}`;
};

const desktopFrameModules = {
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

const mobileFrameModules = {
  ...import.meta.glob("../../assets/mobile-frames/frame_*.jpg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/mobile-frames/frame_*.jpeg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/mobile-frames/frame_*.png", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../assets/mobile-frames/frame_*.webp", {
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

const getFrameFileName = (path, frameNumber, config = HERO_FRAME_SEQUENCE) => {
  const fileExtension = path.match(/\.[a-z0-9]+$/i)?.[0] || config.frameExtension;
  const paddedNumber = String(frameNumber).padStart(config.framePadding, "0");

  return `${config.framePrefix}${paddedNumber}${fileExtension}`;
};

const getDiscoveredFrames = (frameModules, config = HERO_FRAME_SEQUENCE) => Object.entries(frameModules)
  .map(([path, url]) => {
    const frameNumber = getFrameNumber(path, config);

    return {
      frameNumber,
      fileName: getFrameFileName(path, frameNumber, config),
      url,
    };
  })
  .filter((frame) => frame.frameNumber >= config.firstFrame)
  .sort((firstFrame, secondFrame) => firstFrame.frameNumber - secondFrame.frameNumber);

const desktopFrames = getDiscoveredFrames(desktopFrameModules, HERO_FRAME_SEQUENCE);
const mobileFrames = getDiscoveredFrames(mobileFrameModules, HERO_MOBILE_FRAME_SEQUENCE);

export const heroFrames =
  typeof HERO_FRAME_SEQUENCE.totalFrames === "number"
    ? desktopFrames.slice(0, HERO_FRAME_SEQUENCE.totalFrames)
    : desktopFrames;

export const heroMobileFrames =
  typeof HERO_MOBILE_FRAME_SEQUENCE.totalFrames === "number"
    ? mobileFrames.slice(0, HERO_MOBILE_FRAME_SEQUENCE.totalFrames)
    : mobileFrames;
