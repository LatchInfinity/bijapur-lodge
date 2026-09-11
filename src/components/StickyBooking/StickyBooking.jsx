import { useEffect, useMemo, useRef, useState } from "react";
import { submitBooking } from "../../services/bookingApi.js";
import "./StickyBooking.css";

const getDigitsOnly = (value) => value.replace(/\D/g, "");
const getPhoneValue = (value) => getDigitsOnly(value).slice(0, 10);
const getNameValue = (value) => value.replace(/[0-9]/g, "");
const MOBILE_BOOKING_QUERY = "(max-width: 639px)";

export default function StickyBooking({ onBookingComplete }) {
  const bookingRef = useRef(null);
  const openScrollPositionRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const phoneDigits = useMemo(() => getDigitsOnly(phone), [phone]);
  const hasName = name.trim().length >= 2;
  const hasPhone = hasName && phoneDigits.length >= 10;
  const isSubmitting = submitStatus === "submitting";
  const isSent = submitStatus === "sent";
  const step = hasPhone ? "ready" : hasName ? "phone" : "name";
  const canSubmit = hasName && hasPhone && !isSubmitting && !isSent;

  const handleOpenBooking = () => {
    openScrollPositionRef.current = window.scrollY;
    setIsOpen(true);
  };

  const handleCloseBooking = () => {
    const activeElement = document.activeElement;

    if (
      bookingRef.current?.contains(activeElement)
      && typeof activeElement?.blur === "function"
    ) {
      activeElement.blur();
    }

    setIsOpen(false);
  };

  useEffect(() => {
    const footer = document.getElementById("contact");

    if (!footer) {
      return undefined;
    }

    const updateFooterVisibility = () => {
      const footerTop = footer.getBoundingClientRect().top;
      setIsFooterVisible(footerTop < window.innerHeight - 12);
    };

    updateFooterVisibility();
    window.addEventListener("scroll", updateFooterVisibility, { passive: true });
    window.addEventListener("resize", updateFooterVisibility);

    return () => {
      window.removeEventListener("scroll", updateFooterVisibility);
      window.removeEventListener("resize", updateFooterVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const mobileQuery = window.matchMedia(MOBILE_BOOKING_QUERY);
    const closeOnMobileScroll = () => {
      const hasScrolled = Math.abs(window.scrollY - openScrollPositionRef.current) > 2;
      const isBookingFocused = bookingRef.current?.contains(document.activeElement);

      if (mobileQuery.matches && hasScrolled && !isBookingFocused) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", closeOnMobileScroll, { passive: true });

    return () => window.removeEventListener("scroll", closeOnMobileScroll);
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      await submitBooking({
        name: name.trim(),
        phone: phoneDigits,
        sourcePage: window.location.href,
        honeypot: website,
      });

      setSubmitStatus("sent");
      onBookingComplete?.();
    } catch (error) {
      setSubmitStatus("idle");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not send your booking request. Please try again."
      );
    }
  };

  return (
    <aside
      ref={bookingRef}
      className={`sticky-booking ${isOpen ? "sticky-booking--open" : ""} ${isFooterVisible ? "sticky-booking--hidden" : ""} sticky-booking--step-${step}`}
      id="booking"
      aria-label="Quick lodge booking"
    >
      <button
        className="sticky-booking__launcher"
        type="button"
        onClick={handleOpenBooking}
      >
        Book Now
      </button>

      <form className="sticky-booking__panel" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className="sticky-booking__trap" aria-hidden="true">
          <label htmlFor="sticky-booking-website">Website</label>
          <input
            id="sticky-booking-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        <button
          className="sticky-booking__close"
          type="button"
          aria-label="Close booking"
          onClick={handleCloseBooking}
        >
          X
        </button>

        <div className="sticky-booking__field sticky-booking__field--name">
          <label htmlFor="sticky-booking-name">Name</label>
          <input
            id="sticky-booking-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            placeholder="Your name"
            onChange={(event) => setName(getNameValue(event.target.value))}
          />
        </div>

        <div className="sticky-booking__field sticky-booking__field--phone">
          <label htmlFor="sticky-booking-phone">Phone Number</label>
          <input
            id="sticky-booking-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            placeholder="10 digit mobile number"
            maxLength={10}
            pattern="[0-9]{10}"
            onChange={(event) => setPhone(getPhoneValue(event.target.value))}
          />
        </div>

        <button
          className="sticky-booking__submit"
          type="submit"
          disabled={!canSubmit}
        >
          {isSubmitting ? "Sending..." : isSent ? "Sent" : "Book"}
        </button>

        {submitError ? (
          <p className="sticky-booking__error" role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </aside>
  );
}
