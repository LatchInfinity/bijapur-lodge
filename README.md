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

Build for Hostinger under `https://thezari.co.in/bijapur-lodge/`:

```bash
npm run build:hostinger
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

Mobile hero frames are read from:

```text
assets/mobile-frames/frame_001.jpg
assets/mobile-frames/frame_002.jpg
assets/mobile-frames/frame_003.jpg
```

The hero switches to the mobile frame sequence at the configured mobile media query in `src/config/frameSequence.config.js`.

## Booking To Google Sheets

The booking form posts to a Hostinger PHP proxy, which forwards the request to a Google Apps Script Web App. Keep the frontend endpoint relative when the static site and PHP API are on the same Hostinger domain:

```env
VITE_BOOKING_ENDPOINT=/api/bookings.php
```

When the frontend is deployed on GitHub Pages or tested locally against Hostinger PHP, use the Hostinger API URL instead:

```env
VITE_BOOKING_ENDPOINT=https://thezari.co.in/api/bookings.php
```

Hostinger files:

```text
public_html/api/bookings.php
public_html/api/booking-config.php
```

Create `public_html/api/booking-config.php` from `public_html/api/booking-config.example.php`, then add your Apps Script deployment URL, shared secret, and allowed origins. The real config file is ignored by Git.

For GitHub Pages, the allowed origin is `https://latchinfinity.github.io`, not the full `/bijapur-lodge/` page URL.

Apps Script setup:

1. Create a Google Apps Script project.
2. Paste the contents of `google-apps-script/Code.gs`.
3. Add Script Properties:
   - `SHEET_URL`: your Google Sheet link
   - `BOOKING_SHARED_SECRET`: the same secret used by PHP
   - `SHEET_NAME`: `Bookings`
4. Deploy as a Web App with `Execute as: Me` and access allowed for anyone with the deployment URL.

The Google Sheet will receive:

```text
Submitted At, Booking ID, Name, Phone, Source Page, User Agent
```

The frontend sends the booking JSON as `text/plain;charset=UTF-8` so shared hosting does not need to handle a browser preflight before local testing.

After uploading PHP and deploying Apps Script, test:

```text
https://your-domain.com/api/bookings.php?health=1
https://your-domain.com/api/bookings.php?health=upstream
```

The upstream health check confirms that PHP can reach Apps Script and Apps Script can open the configured Google Sheet.

## Meta Pixel

Add your Meta Pixel ID before building:

```env
VITE_META_PIXEL_ID=your-meta-pixel-id
```

The app loads Meta Pixel when this value exists. It tracks `PageView` on the landing page and thank-you page, and tracks `Lead` once after a booking is saved successfully.

For GitHub Pages, add `VITE_META_PIXEL_ID` as a repository variable before deploying. For Hostinger, put it in the local `.env` used before `npm run build`.
