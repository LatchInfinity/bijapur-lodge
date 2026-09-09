const DEFAULT_BOOKING_ENDPOINT = "/api/bookings.php";
const GENERIC_BOOKING_ERROR = "We could not send your booking request. Please try again.";

const getBookingEndpoint = () => (
  import.meta.env.VITE_BOOKING_ENDPOINT || DEFAULT_BOOKING_ENDPOINT
);

export async function submitBooking(bookingDetails) {
  const response = await globalThis.fetch(getBookingEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify(bookingDetails),
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    throw new Error(GENERIC_BOOKING_ERROR);
  }

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || GENERIC_BOOKING_ERROR);
  }

  return result;
}
