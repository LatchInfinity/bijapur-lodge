const BOOKING_HEADERS = [
  'Submitted At',
  'Booking ID',
  'Name',
  'Phone',
  'Start Date',
  'End Date',
  'Nights',
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
      formatIndianDate_(booking.startDate),
      formatIndianDate_(booking.endDate),
      booking.nights,
      booking.sourcePage,
      booking.userAgent,
    ]);

    return jsonResponse_({
      ok: true,
      bookingId: booking.bookingId,
      message: 'Booking request saved.',
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: 'Booking request could not be saved.',
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
  const startDate = String(payload.startDate || '').trim();
  const endDate = String(payload.endDate || '').trim();
  const bookingId = String(payload.bookingId || '').trim();

  if (name.length < 2 || /\d/.test(name)) {
    throw new Error('Invalid name.');
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new Error('Invalid phone.');
  }

  if (!isIsoDate_(startDate) || !isIsoDate_(endDate) || endDate < startDate) {
    throw new Error('Invalid dates.');
  }

  return {
    bookingId: bookingId || createBookingId_(),
    name,
    phone,
    startDate,
    endDate,
    nights: Math.max(1, Number(payload.nights) || calculateNights_(startDate, endDate)),
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
  const firstCell = sheet.getRange(1, 1).getValue();

  if (firstCell) {
    return;
  }

  sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);
}

function isIsoDate_(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00+05:30`));
}

function calculateNights_(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00+05:30`);
  const end = new Date(`${endDate}T00:00:00+05:30`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function formatIndianDate_(value) {
  const parts = value.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
