import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_FRAME_SEQUENCE } from "../../config/frameSequence.config.js";
import "./ScrollFrames.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const drawImageCover = (context, image, canvasWidth, canvasHeight) => {
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

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
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
  const loadedInitialFramesRef = useRef(0);
  const targetFrameRef = useRef(0);
  const lastReportedFrameRef = useRef(-1);
  const lastDrawnFrameRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const isScrollTickingRef = useRef(false);
  const isMountedRef = useRef(false);
  const [loaderProgress, setLoaderProgress] = useState(0);

  const frameCount = frames.length;
  const initialPreloadTarget = Math.min(config.initialPreloadCount, frameCount);
  const isReady = initialPreloadTarget > 0 && loaderProgress >= 1;

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

    return true;
  }, []);

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
        loadingFramesRef.current.delete(frameIndex);

        if (frameIndex < initialPreloadTarget) {
          loadedInitialFramesRef.current += 1;
          updateInitialLoader();
        }

        if (Math.abs(targetFrameRef.current - frameIndex) <= 1) {
          drawFrame(frameIndex);
        }

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
  }, [config.maxConcurrentLoads, drawFrame, frameCount, frames, initialPreloadTarget, updateInitialLoader]);

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
      drawNearestLoadedFrame(targetFrameRef.current);
    }
  }, [drawNearestLoadedFrame]);

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

    targetFrameRef.current = nextFrame;
    onFrameProgressChange?.(frameProgress, frames[nextFrame]);

    if (nextFrame !== lastReportedFrameRef.current) {
      lastReportedFrameRef.current = nextFrame;
      onFrameChange?.(nextFrame, frames[nextFrame]);
    }

    requestFrameWindow(nextFrame);
  }, [
    frameCount,
    frames,
    onFrameChange,
    onFrameProgressChange,
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

    // Load the opening frames first so the canvas never begins blank.
    for (let frameIndex = 0; frameIndex < initialPreloadTarget; frameIndex += 1) {
      requestFrame(frameIndex);
    }

    // Warm sparse frames in the background without decoding the full sequence at once.
    const queueBackgroundFrames = () => {
      const preloadStep = Math.max(config.backgroundPreloadStep, 1);

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += preloadStep) {
        requestFrame(frameIndex);
      }
    };
    const idleCallbackId =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(queueBackgroundFrames, { timeout: 1400 })
        : window.setTimeout(queueBackgroundFrames, 900);

    requestFrameWindow(0);
    resizeCanvas();
    updateScrollTarget();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", queueScrollUpdate, { passive: true });

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", queueScrollUpdate);

      if ("cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      } else {
        window.clearTimeout(idleCallbackId);
      }
    };
  }, [
    config.backgroundPreloadStep,
    frameCount,
    initialPreloadTarget,
    queueScrollUpdate,
    requestFrame,
    requestFrameWindow,
    resizeCanvas,
    updateScrollTarget,
  ]);

  useEffect(() => {
    if (!frameCount) {
      return undefined;
    }

    const animate = () => {
      const targetFrame = clamp(targetFrameRef.current, 0, frameCount - 1);

      // The frame is attached directly to scroll position; RAF only batches the canvas draw.
      if (targetFrame !== lastDrawnFrameRef.current) {
        drawNearestLoadedFrame(targetFrame);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawNearestLoadedFrame, frameCount]);

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
