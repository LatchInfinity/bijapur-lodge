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

## Hero Frames

The hero uses a scroll-synced image sequence:

```text
assets/pc-frames/frame_001.jpg
assets/pc-frames/frame_002.jpg
assets/pc-frames/frame_003.jpg
```

The frame naming and scroll settings are configured in:

```text
src/config/frameSequence.config.js
```

Desktop currently reads frames from `assets/pc-frames`. JPG, JPEG, PNG, and WebP frame files are supported. Mobile-specific frames can be added later with a separate config/source set.
