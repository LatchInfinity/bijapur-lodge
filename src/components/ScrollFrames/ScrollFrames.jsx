import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_FRAME_SEQUENCE } from "../../config/frameSequence.config.js";
import "./ScrollFrames.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const smoothStep = (value) => value * value * (3 - 2 * value);

const drawImageCover = (
  context,
  image,
  canvasWidth,
  canvasHeight,
  { clearCanvas = true, opacity = 1 } = {},
) => {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  if (clearCanvas) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  context.save();
  context.globalAlpha = opacity;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  context.restore();
};

export default function ScrollFrames({
  config = HERO_FRAME_SEQUENCE,
  frames = [],
  onFrameChange,
  onFrameProgressChange,
  scrollContainerRef,
}) {
  const canvasRef = useRef(null);
  const frameCacheRef = useRef(new Map());
  const loadingFramesRef = useRef(new Set());
  const loadingQueueRef = useRef([]);
  const prefetchedFramesRef = useRef(new Set());
  const prefetchingFramesRef = useRef(new Set());
  const prefetchQueueRef = useRef([]);
  const prefetchAbortControllerRef = useRef(null);
  const loadedInitialFramesRef = useRef(0);
  const targetFrameRef = useRef(0);
  const targetFrameProgressRef = useRef(0);
  const lastReportedFrameRef = useRef(-1);
  const lastDrawnFrameRef = useRef(-1);
  const lastDrawnFrameProgressRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const isScrollTickingRef = useRef(false);
  const isMountedRef = useRef(false);
  const [loaderProgress, setLoaderProgress] = useState(0);

  const frameCount = frames.length;
  const initialPreloadTarget = Math.min(config.initialPreloadCount, frameCount);
  const isReady = initialPreloadTarget > 0 && loaderProgress >= 1;

  const trimDecodedFrameCache = useCallback((centerFrame = targetFrameRef.current) => {
    const cacheLimit = Number(config.decodedFrameCacheLimit);

    if (!Number.isFinite(cacheLimit) || cacheLimit <= 0 || frameCacheRef.current.size <= cacheLimit) {
      return;
    }

    const farthestFrames = Array.from(frameCacheRef.current.keys()).sort((firstFrame, secondFrame) => {
      const distanceDifference =
        Math.abs(secondFrame - centerFrame) - Math.abs(firstFrame - centerFrame);

      return distanceDifference || secondFrame - firstFrame;
    });

    while (frameCacheRef.current.size > cacheLimit && farthestFrames.length > 0) {
      const frameIndex = farthestFrames.shift();

      if (frameIndex !== centerFrame) {
        frameCacheRef.current.delete(frameIndex);
      }
    }
  }, [config.decodedFrameCacheLimit]);

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    const image = frameCacheRef.current.get(frameIndex);

    if (!canvas || !image?.complete) {
      return false;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return false;
    }

    drawImageCover(context, image, canvas.width, canvas.height);
    lastDrawnFrameRef.current = frameIndex;
    lastDrawnFrameProgressRef.current = frameIndex;

    return true;
  }, []);

  const drawFrameProgress = useCallback((frameProgress) => {
    const canvas = canvasRef.current;
    const lowerFrame = clamp(Math.floor(frameProgress), 0, frameCount - 1);
    const upperFrame = clamp(Math.ceil(frameProgress), 0, frameCount - 1);
    const lowerImage = frameCacheRef.current.get(lowerFrame);

    if (!canvas || !lowerImage?.complete) {
      return false;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return false;
    }

    const blendProgress = config.frameBlendEnabled
      ? smoothStep(clamp(frameProgress - lowerFrame, 0, 1))
      : 0;
    const upperImage = frameCacheRef.current.get(upperFrame);

    drawImageCover(context, lowerImage, canvas.width, canvas.height);

    if (upperFrame !== lowerFrame && upperImage?.complete && blendProgress > 0) {
      drawImageCover(context, upperImage, canvas.width, canvas.height, {
        clearCanvas: false,
        opacity: blendProgress,
      });
    }

    lastDrawnFrameRef.current = lowerFrame;
    lastDrawnFrameProgressRef.current = frameProgress;

    return true;
  }, [config.frameBlendEnabled, frameCount]);

  const drawNearestLoadedFrame = useCallback(
    (frameIndex) => {
      if (drawFrame(frameIndex)) {
        return;
      }

      for (let offset = 1; offset <= config.nearestFrameSearchRadius; offset += 1) {
        const previousFrame = frameIndex - offset;
        const nextFrame = frameIndex + offset;

        if (previousFrame >= 0 && drawFrame(previousFrame)) {
          return;
        }

        if (nextFrame < frameCount && drawFrame(nextFrame)) {
          return;
        }
      }
    },
    [config.nearestFrameSearchRadius, drawFrame, frameCount],
  );

  const updateInitialLoader = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    if (!initialPreloadTarget) {
      setLoaderProgress(1);
      return;
    }

    const loadedCount = Math.min(loadedInitialFramesRef.current, initialPreloadTarget);
    setLoaderProgress(loadedCount / initialPreloadTarget);
  }, [initialPreloadTarget]);

  const pumpLoadingQueue = useCallback(function pumpQueue() {
    while (
      loadingFramesRef.current.size < config.maxConcurrentLoads &&
      loadingQueueRef.current.length > 0
    ) {
      const frameIndex = loadingQueueRef.current.shift();

      if (
        frameIndex < 0 ||
        frameIndex >= frameCount ||
        frameCacheRef.current.has(frameIndex) ||
        loadingFramesRef.current.has(frameIndex)
      ) {
        continue;
      }

      loadingFramesRef.current.add(frameIndex);

      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (!isMountedRef.current) {
          return;
        }

        frameCacheRef.current.set(frameIndex, image);
        prefetchedFramesRef.current.add(frameIndex);
        loadingFramesRef.current.delete(frameIndex);

        if (frameIndex < initialPreloadTarget) {
          loadedInitialFramesRef.current += 1;
          updateInitialLoader();
        }

        if (Math.abs(targetFrameRef.current - frameIndex) <= 1) {
          drawFrameProgress(targetFrameProgressRef.current) || drawFrame(frameIndex);
        }

        trimDecodedFrameCache(targetFrameRef.current);
        pumpQueue();
      };
      image.onerror = () => {
        if (!isMountedRef.current) {
          return;
        }

        loadingFramesRef.current.delete(frameIndex);
        pumpQueue();
      };
      image.src = frames[frameIndex].url;
    }
  }, [
    config.maxConcurrentLoads,
    drawFrame,
    drawFrameProgress,
    frameCount,
    frames,
    initialPreloadTarget,
    trimDecodedFrameCache,
    updateInitialLoader,
  ]);

  const pumpPrefetchQueue = useCallback(function pumpQueue() {
    if (!config.prefetchAllFrames || !("fetch" in window)) {
      return;
    }

    const concurrentLoads = Math.max(Number(config.prefetchConcurrentLoads) || 1, 1);

    while (
      prefetchingFramesRef.current.size < concurrentLoads &&
      prefetchQueueRef.current.length > 0
    ) {
      const frameIndex = prefetchQueueRef.current.shift();

      if (
        frameIndex < 0 ||
        frameIndex >= frameCount ||
        prefetchedFramesRef.current.has(frameIndex) ||
        prefetchingFramesRef.current.has(frameIndex)
      ) {
        continue;
      }

      const frame = frames[frameIndex];

      if (!frame?.url) {
        continue;
      }

      prefetchingFramesRef.current.add(frameIndex);

      const requestOptions = {
        cache: "force-cache",
      };

      if (prefetchAbortControllerRef.current?.signal) {
        requestOptions.signal = prefetchAbortControllerRef.current.signal;
      }

      window
        .fetch(frame.url, requestOptions)
        .then((response) => {
          if (response.ok) {
            prefetchedFramesRef.current.add(frameIndex);
          }
        })
        .catch(() => {
          // The regular image loader remains the fallback if a background prefetch misses.
        })
        .finally(() => {
          if (!isMountedRef.current) {
            return;
          }

          prefetchingFramesRef.current.delete(frameIndex);
          pumpQueue();
        });
    }
  }, [config.prefetchAllFrames, config.prefetchConcurrentLoads, frameCount, frames]);

  const queueFullFramePrefetch = useCallback(() => {
    if (!config.prefetchAllFrames || !("fetch" in window)) {
      return;
    }

    prefetchQueueRef.current = [];

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      if (
        frameCacheRef.current.has(frameIndex) ||
        loadingFramesRef.current.has(frameIndex) ||
        loadingQueueRef.current.includes(frameIndex) ||
        prefetchedFramesRef.current.has(frameIndex) ||
        prefetchingFramesRef.current.has(frameIndex)
      ) {
        continue;
      }

      prefetchQueueRef.current.push(frameIndex);
    }

    pumpPrefetchQueue();
  }, [config.prefetchAllFrames, frameCount, pumpPrefetchQueue]);

  const requestFrame = useCallback(
    (frameIndex) => {
      if (
        frameIndex < 0 ||
        frameIndex >= frameCount ||
        frameCacheRef.current.has(frameIndex) ||
        loadingFramesRef.current.has(frameIndex) ||
        loadingQueueRef.current.includes(frameIndex)
      ) {
        return;
      }

      loadingQueueRef.current.push(frameIndex);
      pumpLoadingQueue();
    },
    [frameCount, pumpLoadingQueue],
  );

  const requestFrameWindow = useCallback(
    (centerFrame) => {
      const startFrame = clamp(centerFrame - config.preloadBehind, 0, frameCount - 1);
      const endFrame = clamp(centerFrame + config.preloadAhead, 0, frameCount - 1);

      for (let frameIndex = startFrame; frameIndex <= endFrame; frameIndex += 1) {
        requestFrame(frameIndex);
      }
    },
    [config.preloadAhead, config.preloadBehind, frameCount, requestFrame],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    // Match the canvas backing store to the rendered size for sharp frames on high-DPI screens.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(canvas.clientWidth * pixelRatio);
    const height = Math.floor(canvas.clientHeight * pixelRatio);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      drawFrameProgress(targetFrameProgressRef.current) ||
        drawNearestLoadedFrame(targetFrameRef.current);
    }
  }, [drawFrameProgress, drawNearestLoadedFrame]);

  const updateScrollTarget = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container || frameCount < 2) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const scrollableDistance = Math.max(container.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / scrollableDistance, 0, 1);
    const frameProgress = progress * (frameCount - 1);
    const nextFrame = clamp(Math.floor(frameProgress), 0, frameCount - 1);
    const blendFrame = clamp(Math.ceil(frameProgress), 0, frameCount - 1);

    targetFrameProgressRef.current = frameProgress;
    targetFrameRef.current = nextFrame;
    onFrameProgressChange?.(frameProgress, frames[nextFrame]);

    if (nextFrame !== lastReportedFrameRef.current) {
      lastReportedFrameRef.current = nextFrame;
      onFrameChange?.(nextFrame, frames[nextFrame]);
    }

    requestFrameWindow(nextFrame);
    requestFrame(blendFrame);
  }, [
    frameCount,
    frames,
    onFrameChange,
    onFrameProgressChange,
    requestFrame,
    requestFrameWindow,
    scrollContainerRef,
  ]);

  const queueScrollUpdate = useCallback(() => {
    if (isScrollTickingRef.current) {
      return;
    }

    isScrollTickingRef.current = true;
    window.requestAnimationFrame(() => {
      updateScrollTarget();
      isScrollTickingRef.current = false;
    });
  }, [updateScrollTarget]);

  useEffect(() => {
    if (!frameCount) {
      return undefined;
    }

    isMountedRef.current = true;
    const frameCache = frameCacheRef.current;
    const loadingFrames = loadingFramesRef.current;
    const prefetchedFrames = prefetchedFramesRef.current;
    const prefetchingFrames = prefetchingFramesRef.current;

    // Load the opening frames first so the canvas never begins blank.
    for (let frameIndex = 0; frameIndex < initialPreloadTarget; frameIndex += 1) {
      requestFrame(frameIndex);
    }

    prefetchAbortControllerRef.current =
      "AbortController" in window ? new window.AbortController() : null;

    requestFrameWindow(0);
    resizeCanvas();
    updateScrollTarget();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", queueScrollUpdate, { passive: true });

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", queueScrollUpdate);

      prefetchAbortControllerRef.current?.abort();
      prefetchAbortControllerRef.current = null;
      frameCache.clear();
      loadingFrames.clear();
      loadingQueueRef.current = [];
      prefetchedFrames.clear();
      prefetchQueueRef.current = [];
      prefetchingFrames.clear();
    };
  }, [
    frameCount,
    initialPreloadTarget,
    queueScrollUpdate,
    requestFrame,
    requestFrameWindow,
    resizeCanvas,
    updateScrollTarget,
  ]);

  useEffect(() => {
    if (!isReady || !frameCount || !config.prefetchAllFrames) {
      return undefined;
    }

    const timerId = window.setTimeout(
      queueFullFramePrefetch,
      Math.max(Number(config.prefetchStartDelay) || 0, 0),
    );

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    config.prefetchAllFrames,
    config.prefetchStartDelay,
    frameCount,
    isReady,
    queueFullFramePrefetch,
  ]);

  useEffect(() => {
    if (!frameCount) {
      return undefined;
    }

    const animate = () => {
      const targetFrameProgress = clamp(targetFrameProgressRef.current, 0, frameCount - 1);
      const targetFrame = clamp(Math.floor(targetFrameProgress), 0, frameCount - 1);
      const progressDelta = Math.abs(
        targetFrameProgress - lastDrawnFrameProgressRef.current,
      );
      const redrawThreshold = Math.max(Number(config.frameBlendProgressThreshold) || 0, 0);

      // The frame is attached directly to scroll position; RAF only batches the canvas draw.
      if (targetFrame !== lastDrawnFrameRef.current || progressDelta >= redrawThreshold) {
        drawFrameProgress(targetFrameProgress) || drawNearestLoadedFrame(targetFrame);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.frameBlendProgressThreshold, drawFrameProgress, drawNearestLoadedFrame, frameCount]);

  return (
    <div className="scroll-frames" aria-hidden="true">
      <canvas ref={canvasRef} className="scroll-frames__canvas" />
      <div
        className={`scroll-frames__loader ${isReady ? "scroll-frames__loader--hidden" : ""}`}
        style={{ backgroundImage: frames[0] ? `url(${frames[0].url})` : undefined }}
      >
        <span style={{ transform: `scaleX(${loaderProgress})` }} />
      </div>
    </div>
  );
}
