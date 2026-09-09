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
public/media/upscaled-video-scrub-mobile-preview.mp4
public/media/upscaled-video-scrub-mobile.webm
```

The desktop preview MP4 is the first-load fallback and is kept close to 5 MB. Mobile uses a smaller 720p MP4 fallback first, then a smaller 720p WebM upgrade. The WebM downloads after the matching MP4 is ready, then replaces it automatically in browsers that support VP9 WebM.

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

2. Generate the desktop MP4 fallback:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -vf scale=1920:-2 -c:v libx264 -preset veryfast -crf 31 -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/media/upscaled-video-scrub-preview.mp4
```

3. Generate the desktop WebM upgrade:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -c:v libvpx-vp9 -deadline good -cpu-used 5 -crf 28 -b:v 0 -g 15 -row-mt 1 -pix_fmt yuv420p public/media/upscaled-video-scrub.webm
```

4. Generate the mobile MP4 fallback:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -vf scale=1280:-2 -c:v libx264 -preset veryfast -crf 32 -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/media/upscaled-video-scrub-mobile-preview.mp4
```

5. Generate the mobile WebM upgrade:

```bash
ffmpeg -y -i assets/upscaled-video.mp4 -an -vf scale=1280:-2 -c:v libvpx-vp9 -deadline good -cpu-used 5 -crf 30 -b:v 0 -g 15 -row-mt 1 -pix_fmt yuv420p public/media/upscaled-video-scrub-mobile.webm
```

6. Test locally:

```bash
npm run dev
```

7. Build for production:

```bash
npm run build
```

## Why The Scrub Video Exists

Normal video files can feel jumpy during scroll seeking because the browser may need to decode from nearby keyframes. The MP4 fallback is encoded with every frame as a keyframe, so the first-load scroll experience stays responsive.

The matching MP4 fallback is preloaded from `index.html`, so mobile and desktop each start downloading the correct first-load video as the website loads. The WebM upgrade starts in the background after the MP4 is ready and swaps in once it has fully downloaded.

If you rename either hero video file, update both:

```text
src/config/heroVideo.config.js
index.html
```
