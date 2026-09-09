import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_SCROLL_VIDEO } from "../../config/heroVideo.config.js";
import "./ScrollVideo.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getFallbackSource = (config) => ({
  src: config.fallbackSrc || config.src,
  type: config.fallbackType || config.type || "video/mp4",
});

const canUseBlobSource = (useBlobSource) => (
  useBlobSource
  && "fetch" in window
  && "URL" in window
  && "Blob" in window
);

const canUseEnhancedSource = ({ enhancedSrc, enhancedType, upgradeToEnhancedSource }) => {
  if (!upgradeToEnhancedSource || !enhancedSrc || !enhancedType) {
    return false;
  }

  const probeVideo = document.createElement("video");
  return Boolean(probeVideo.canPlayType(enhancedType));
};

const loadVideoBlob = async ({ src, type, signal, onProgress }) => {
  const response = await window.fetch(src, {
    cache: "force-cache",
    credentials: "same-origin",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Video request failed with ${response.status}`);
  }

  const totalBytes = Number(response.headers.get("content-length")) || 0;

  if (response.body && totalBytes > 0) {
    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;
    let isReading = true;

    while (isReading) {
      const { done, value } = await reader.read();

      if (done) {
        isReading = false;
        continue;
      }

      chunks.push(value);
      receivedBytes += value.byteLength;
      onProgress?.(clamp(receivedBytes / totalBytes, 0.08, 0.98));
    }

    return window.URL.createObjectURL(new window.Blob(chunks, { type }));
  }

  const fetchedBlob = await response.blob();
  const videoBlob = fetchedBlob.type ? fetchedBlob : new window.Blob([fetchedBlob], { type });

  return window.URL.createObjectURL(videoBlob);
};

export default function ScrollVideo({
  config = HERO_SCROLL_VIDEO,
  onProgressChange,
  scrollContainerRef,
}) {
  const videoRef = useRef(null);
  const seekAnimationFrameRef = useRef(null);
  const scrollAnimationFrameRef = useRef(null);
  const seekTimeoutRef = useRef(null);
  const lastSeekAtRef = useRef(0);
  const targetProgressRef = useRef(0);
  const [videoSrc, setVideoSrc] = useState(() => (
    config.useBlobSource ? "" : getFallbackSource(config).src
  ));
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(config.useBlobSource ? 0 : 0.08);

  const getFrameDuration = useCallback(() => {
    const targetFrameRate = Number(config.targetFrameRate);
    const frameRate = Number.isFinite(targetFrameRate) && targetFrameRate > 0
      ? targetFrameRate
      : 30;

    return 1 / frameRate;
  }, [config.targetFrameRate]);

  const updateBufferedProgress = useCallback(() => {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const bufferedRangeCount = video.buffered.length;

    if (!bufferedRangeCount) {
      return;
    }

    const bufferedEnd = video.buffered.end(bufferedRangeCount - 1);
    setLoadProgress(clamp(bufferedEnd / video.duration, 0, 1));
  }, []);

  const getTargetVideoTime = useCallback(
    (video) => {
      const frameDuration = getFrameDuration();
      const endSnapProgress = clamp(Number(config.endSnapProgress) || 1, 0, 1);
      const endOffset = Math.min(frameDuration * 0.15, 0.01);
      const playableDuration = Math.max(video.duration - endOffset, 0);
      const progress = targetProgressRef.current;

      if (progress >= endSnapProgress) {
        return playableDuration;
      }

      const rawTargetTime = clamp(progress * playableDuration, 0, playableDuration);
      const snappedFrame = Math.round(rawTargetTime / frameDuration);

      return clamp(snappedFrame * frameDuration, 0, playableDuration);
    },
    [config.endSnapProgress, getFrameDuration],
  );

  const syncVideoToScroll = useCallback(() => {
    const video = videoRef.current;

    if (!video || !videoSrc || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const seekThrottleMs = Math.max(Number(config.seekThrottleMs) || 0, 0);
    const now = window.performance?.now?.() ?? Date.now();
    const timeSinceLastSeek = now - lastSeekAtRef.current;

    if (timeSinceLastSeek < seekThrottleMs) {
      window.clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = window.setTimeout(
        syncVideoToScroll,
        seekThrottleMs - timeSinceLastSeek,
      );
      return;
    }

    const targetTime = getTargetVideoTime(video);
    const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const seekEpsilon = Math.max(Number(config.seekEpsilon) || 0, 0);

    if (Math.abs(currentTime - targetTime) <= seekEpsilon) {
      return;
    }

    lastSeekAtRef.current = now;

    try {
      video.pause();
      video.currentTime = targetTime;
    } catch {
      // A browser can briefly reject a seek while the media element is changing source.
    }
  }, [config.seekEpsilon, config.seekThrottleMs, getTargetVideoTime, videoSrc]);

  const queueSeekToScroll = useCallback(() => {
    if (seekAnimationFrameRef.current) {
      return;
    }

    seekAnimationFrameRef.current = window.requestAnimationFrame(() => {
      seekAnimationFrameRef.current = null;
      syncVideoToScroll();
    });
  }, [syncVideoToScroll]);

  const updateScrollTarget = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const scrollableDistance = Math.max(container.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / scrollableDistance, 0, 1);

    targetProgressRef.current = progress;
    onProgressChange?.(progress);
    queueSeekToScroll();
  }, [onProgressChange, queueSeekToScroll, scrollContainerRef]);

  const queueScrollUpdate = useCallback(() => {
    if (scrollAnimationFrameRef.current) {
      return;
    }

    scrollAnimationFrameRef.current = window.requestAnimationFrame(() => {
      scrollAnimationFrameRef.current = null;
      updateScrollTarget();
    });
  }, [updateScrollTarget]);

  useEffect(() => {
    const fallbackSource = {
      src: config.fallbackSrc || config.src,
      type: config.fallbackType || config.type || "video/mp4",
    };

    if (!canUseBlobSource(config.useBlobSource)) {
      setVideoSrc(fallbackSource.src);
      setLoadProgress(0.08);
      return undefined;
    }

    let isCancelled = false;
    let fallbackObjectUrl = "";
    let enhancedObjectUrl = "";
    let enhancedStartTimeout = null;
    const fallbackAbortController = new window.AbortController();
    const enhancedAbortController = new window.AbortController();

    const loadFallbackVideo = async () => {
      setIsReady(false);
      setVideoSrc("");
      setLoadProgress(0.04);

      try {
        fallbackObjectUrl = await loadVideoBlob({
          src: fallbackSource.src,
          type: fallbackSource.type,
          signal: fallbackAbortController.signal,
          onProgress: (progress) => {
            if (!isCancelled) {
              setLoadProgress(progress);
            }
          },
        });

        if (isCancelled) {
          return;
        }

        setVideoSrc(fallbackObjectUrl);
        setLoadProgress(1);
      } catch (error) {
        if (isCancelled || error?.name === "AbortError") {
          return;
        }

        setVideoSrc(fallbackSource.src);
        setLoadProgress(0.08);
      }
    };

    const loadEnhancedVideo = async () => {
      if (!canUseEnhancedSource({
        enhancedSrc: config.enhancedSrc,
        enhancedType: config.enhancedType,
        upgradeToEnhancedSource: config.upgradeToEnhancedSource,
      })) {
        return;
      }

      try {
        enhancedObjectUrl = await loadVideoBlob({
          src: config.enhancedSrc,
          type: config.enhancedType,
          signal: enhancedAbortController.signal,
        });

        if (!isCancelled) {
          setVideoSrc(enhancedObjectUrl);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          enhancedObjectUrl = "";
        }
      }
    };

    const loadVideoSources = async () => {
      await loadFallbackVideo();

      if (isCancelled) {
        return;
      }

      enhancedStartTimeout = window.setTimeout(
        loadEnhancedVideo,
        Math.max(Number(config.enhancedStartDelay) || 0, 0),
      );
    };

    loadVideoSources();

    return () => {
      isCancelled = true;
      fallbackAbortController.abort();
      enhancedAbortController.abort();
      window.clearTimeout(enhancedStartTimeout);

      if (fallbackObjectUrl) {
        window.URL.revokeObjectURL(fallbackObjectUrl);
      }

      if (enhancedObjectUrl) {
        window.URL.revokeObjectURL(enhancedObjectUrl);
      }
    };
  }, [
    config.enhancedSrc,
    config.enhancedStartDelay,
    config.enhancedType,
    config.fallbackSrc,
    config.fallbackType,
    config.src,
    config.type,
    config.upgradeToEnhancedSource,
    config.useBlobSource,
  ]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoSrc) {
      return undefined;
    }

    const handleReady = () => {
      video.pause();
      setIsReady(true);
      updateBufferedProgress();
      updateScrollTarget();
      queueSeekToScroll();
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("progress", updateBufferedProgress);

    video.load();
    updateScrollTarget();

    window.addEventListener("resize", updateScrollTarget);
    window.addEventListener("scroll", queueScrollUpdate, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("progress", updateBufferedProgress);
      window.removeEventListener("resize", updateScrollTarget);
      window.removeEventListener("scroll", queueScrollUpdate);
      window.clearTimeout(seekTimeoutRef.current);

      if (seekAnimationFrameRef.current) {
        window.cancelAnimationFrame(seekAnimationFrameRef.current);
        seekAnimationFrameRef.current = null;
      }

      if (scrollAnimationFrameRef.current) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [
    queueScrollUpdate,
    queueSeekToScroll,
    updateBufferedProgress,
    updateScrollTarget,
    videoSrc,
  ]);

  return (
    <div className="scroll-video" aria-hidden="true">
      <video
        ref={videoRef}
        className="scroll-video__media"
        src={videoSrc || undefined}
        muted
        playsInline
        preload={config.preload}
        disablePictureInPicture
      />
      <div className={`scroll-video__loader ${isReady ? "scroll-video__loader--hidden" : ""}`}>
        <span style={{ transform: `scaleX(${loadProgress || 0.08})` }} />
      </div>
    </div>
  );
}
