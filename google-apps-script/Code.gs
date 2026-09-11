const BOOKING_HEADERS = [
  'Submitted At',
  'Booking ID',
  'Name',
  'Phone',
  'Source Page',
  'User Agent',
];

function doPost(event) {
  const lock = LockService.getScriptLock();
  let isLocked = false;

  try {
    lock.waitLock(5000);
    isLocked = true;

    const payload = parsePayload_(event);
    const properties = PropertiesService.getScriptProperties();
    const sharedSecret = properties.getProperty('BOOKING_SHARED_SECRET');

    if (!sharedSecret || payload.secret !== sharedSecret) {
      return jsonResponse_({
        ok: false,
        message: 'Unauthorized booking request.',
      });
    }

    if (payload.action === 'health') {
      return jsonResponse_(getHealth_(properties));
    }

    const booking = validateBooking_(payload);
    const sheet = getBookingSheet_(properties);

    ensureHeaders_(sheet);
    sheet.appendRow([
      new Date(),
      booking.bookingId,
      booking.name,
      booking.phone,
      booking.sourcePage,
      booking.userAgent,
    ]);

    return jsonResponse_({
      ok: true,
      saved: true,
      bookingId: booking.bookingId,
      message: 'Booking request saved.',
    });
  } catch (error) {
    console.error(error);

    return jsonResponse_({
      ok: false,
      message: getPublicErrorMessage_(error),
    });
  } finally {
    if (isLocked) {
      lock.releaseLock();
    }
  }
}

function doGet() {
  return jsonResponse_(getHealth_(PropertiesService.getScriptProperties()));
}

function parsePayload_(event) {
  const contents = event && event.postData ? event.postData.contents : '{}';
  return JSON.parse(contents || '{}');
}

function validateBooking_(payload) {
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').replace(/\D/g, '');
  const bookingId = String(payload.bookingId || '').trim();

  if (name.length < 2 || /\d/.test(name)) {
    throw new Error('Invalid name.');
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new Error('Invalid phone.');
  }

  return {
    bookingId: bookingId || createBookingId_(),
    name,
    phone,
    sourcePage: String(payload.sourcePage || '').trim(),
    userAgent: String(payload.userAgent || '').trim(),
  };
}

function getBookingSheet_(properties) {
  const sheetUrl = properties.getProperty('SHEET_URL');
  const sheetName = properties.getProperty('SHEET_NAME') || 'Bookings';

  if (!sheetUrl) {
    throw new Error('Missing SHEET_URL.');
  }

  const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getHealth_(properties) {
  const sheetUrl = properties.getProperty('SHEET_URL');
  const sharedSecret = properties.getProperty('BOOKING_SHARED_SECRET');
  const sheetName = properties.getProperty('SHEET_NAME') || 'Bookings';
  const config = {
    hasSheetUrl: Boolean(sheetUrl),
    hasSharedSecret: Boolean(sharedSecret),
    sheetName,
    canOpenSpreadsheet: false,
    sheetReady: false,
  };

  if (sheetUrl) {
    try {
      const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
      config.canOpenSpreadsheet = true;
      config.sheetReady = Boolean(spreadsheet.getSheetByName(sheetName)) || Boolean(spreadsheet.insertSheet(sheetName));
    } catch (error) {
      config.canOpenSpreadsheet = false;
      config.sheetReady = false;
    }
  }

  return {
    ok: config.hasSheetUrl && config.hasSharedSecret && config.canOpenSpreadsheet && config.sheetReady,
    message: config.hasSheetUrl && config.hasSharedSecret
      ? 'Apps Script booking service checked.'
      : 'Apps Script properties are missing.',
    config,
  };
}

function ensureHeaders_(sheet) {
  sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);

  const extraHeaderColumns = sheet.getLastColumn() - BOOKING_HEADERS.length;

  if (extraHeaderColumns > 0) {
    sheet.getRange(1, BOOKING_HEADERS.length + 1, 1, extraHeaderColumns).clearContent();
  }
}

function getPublicErrorMessage_(error) {
  const message = error && error.message ? String(error.message) : '';

  if (message.includes('Invalid name')) {
    return 'Please enter a valid name.';
  }

  if (message.includes('Invalid phone')) {
    return 'Please enter a 10 digit phone number.';
  }

  if (message.includes('Missing SHEET_URL') || message.includes('openByUrl')) {
    return 'Google Sheet could not be opened. Check SHEET_URL and Sheet access.';
  }

  if (message.includes('appendRow') || message.includes('permissions')) {
    return 'Google Sheet could not be updated. Check Sheet permissions.';
  }

  if (message.includes('Invalid dates')) {
    return 'Apps Script is still using an old deployment. Redeploy the latest Code.gs version.';
  }

  return 'Booking request could not be saved.';
}

function createBookingId_() {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd-HHmmss');
  const suffix = Utilities.getUuid().slice(0, 4).toUpperCase();
  return `BL-${stamp}-${suffix}`;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
