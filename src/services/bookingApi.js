const DEFAULT_BOOKING_ENDPOINT = "/api/bookings.php";
const GITHUB_PAGES_BOOKING_ENDPOINT = "https://thezari.co.in/api/bookings.php";
const GENERIC_BOOKING_ERROR = "We could not send your booking request. Please try again.";
const NETWORK_BOOKING_ERROR = "Booking service could not be reached. Please try again.";

const getBookingEndpoint = () => {
  if (import.meta.env.VITE_BOOKING_ENDPOINT) {
    return import.meta.env.VITE_BOOKING_ENDPOINT;
  }

  if (globalThis.location?.hostname.endsWith("github.io")) {
    return GITHUB_PAGES_BOOKING_ENDPOINT;
  }

  return DEFAULT_BOOKING_ENDPOINT;
};

export async function submitBooking(bookingDetails) {
  let response = null;

  try {
    response = await globalThis.fetch(getBookingEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify(bookingDetails),
    });
  } catch {
    throw new Error(NETWORK_BOOKING_ERROR);
  }

  let result = null;

  try {
    result = await response.json();
  } catch {
    throw new Error(GENERIC_BOOKING_ERROR);
  }

  if (
    !response.ok
    || result?.ok !== true
    || !result?.bookingId
  ) {
    throw new Error(result?.message || GENERIC_BOOKING_ERROR);
  }

  return result;
}
