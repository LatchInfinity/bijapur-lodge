# Hostinger Deployment

This Vite React site can be deployed as static files on Hostinger, with a PHP booking API on the same domain.

## Local Check

```bash
npm ci
npm run deploy:check
```

## Frontend Upload

1. Build the site:

   ```bash
   npm run build
   ```

2. Upload the contents of `dist/` to Hostinger `public_html/`.

## Booking API Upload

1. Upload `public_html/api/bookings.php` to Hostinger:

   ```text
   public_html/api/bookings.php
   ```

2. Copy `public_html/api/booking-config.example.php` to:

   ```text
   public_html/api/booking-config.php
   ```

3. Fill in:

   ```php
   'apps_script_web_app_url' => 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   'booking_shared_secret' => 'same-secret-as-apps-script',
   'allowed_origins' => [
       'https://thezari.co.in',
       'https://latchinfinity.github.io',
       'http://localhost:5173',
       'http://127.0.0.1:5173',
   ],
   ```

The real `booking-config.php` file is ignored by Git.

## Google Apps Script

1. Create a Google Apps Script project.
2. Paste `google-apps-script/Code.gs`.
3. Add Script Properties:
   - `SHEET_URL`: your Google Sheet link
   - `BOOKING_SHARED_SECRET`: the same value from PHP
   - `SHEET_NAME`: `Bookings`
4. Deploy as a Web App:
   - Execute as: `Me`
   - Access: anyone with the deployment URL

## Production Test

Submit a valid booking from the live Hostinger site and confirm a new row appears in the Google Sheet. Invalid names, non-10-digit phone numbers, missing dates, and end dates before start dates should stay on the form with an error.

For local testing from Vite, keep `http://localhost:5173` in `allowed_origins`. The frontend sends the booking JSON as `text/plain;charset=UTF-8`, which avoids a browser preflight on shared hosting while still letting PHP forward JSON to Apps Script.

For GitHub Pages testing, keep `https://latchinfinity.github.io` in `allowed_origins`. Do not include `/bijapur-lodge/` in the origin because browser CORS origins contain only scheme, host, and port.

Open this URL after uploading the PHP files to confirm the live endpoint is configured:

```text
https://your-domain.com/api/bookings.php?health=1
```

`configFileFound`, `hasAppsScriptUrl`, and `hasSharedSecret` should all be `true`.

Then check the Apps Script connection through PHP:

```text
https://your-domain.com/api/bookings.php?health=upstream
```

`appsScript.ok` should be `true`, and Apps Script config should show `hasSheetUrl`, `hasSharedSecret`, `canOpenSpreadsheet`, and `sheetReady` as `true`.
