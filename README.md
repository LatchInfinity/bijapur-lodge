# Bijapur Lodge

SEO-friendly Vite, React, and Tailwind CSS landing page for Bijapur Lodge.

## Setup

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Run checks before deployment:

```bash
npm run lint
npm run build
```

## Hero Video

The hero uses a two-step scroll video setup:

```text
public/media/upscaled-video-scrub-preview.mp4
public/media/upscaled-video-scrub.webm
```

The preview MP4 is the first-load fallback and is kept close to 5 MB. The WebM downloads after the MP4 is ready, then replaces it automatically in browsers that support VP9 WebM.

The original/source video can be kept here:

```text
assets/upscaled-video.mp4
```

The source video is not used directly by the live hero. It is useful when you want to regenerate the web-ready versions.

## Change The Hero Video

1. Replace the source video:

```text
assets/upscaled-video.mp4
```

2. Generate the small MP4 fallback:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -vf scale=1920:-2 -c:v libx264 -preset veryfast -crf 31 -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/media/upscaled-video-scrub-preview.mp4
```

3. Generate the higher-quality WebM upgrade:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -c:v libvpx-vp9 -deadline good -cpu-used 5 -crf 28 -b:v 0 -g 15 -row-mt 1 -pix_fmt yuv420p public/media/upscaled-video-scrub.webm
```

4. Test locally:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Why The Scrub Video Exists

Normal video files can feel jumpy during scroll seeking because the browser may need to decode from nearby keyframes. The MP4 fallback is encoded with every frame as a keyframe, so the first-load scroll experience stays responsive.

The MP4 fallback is preloaded from `index.html`, so it starts downloading as the website loads. The WebM upgrade starts in the background after the MP4 is ready and swaps in once it has fully downloaded.

If you rename either hero video file, update both:

```text
src/config/heroVideo.config.js
index.html
```
