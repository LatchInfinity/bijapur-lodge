import { useEffect, useMemo, useRef, useState } from "react";
import { submitBooking } from "../../services/bookingApi.js";
import "./StickyBooking.css";

const getDigitsOnly = (value) => value.replace(/\D/g, "");
const getPhoneValue = (value) => getDigitsOnly(value).slice(0, 10);
const getNameValue = (value) => value.replace(/[0-9]/g, "");
const MOBILE_BOOKING_QUERY = "(max-width: 639px)";
const formatIndianDate = (value) => {
  if (!value) {
    return "dd/mm/yyyy";
  }

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
};

export default function StickyBooking({ onBookingComplete }) {
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const openScrollPositionRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [website, setWebsite] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const phoneDigits = useMemo(() => getDigitsOnly(phone), [phone]);
  const hasName = name.trim().length >= 2;
  const hasPhone = hasName && phoneDigits.length >= 10;
  const hasValidDateRange = Boolean(startDate && endDate && endDate >= startDate);
  const isSubmitting = submitStatus === "submitting";
  const isSent = submitStatus === "sent";
  const step = hasPhone ? "date" : hasName ? "phone" : "name";
  const canSubmit = hasName && hasPhone && hasValidDateRange && !isSubmitting && !isSent;

  const openDatePicker = (inputRef) => {
    const dateInput = inputRef.current;

    if (!dateInput) {
      return;
    }

    dateInput.focus();

    if (typeof dateInput.showPicker === "function") {
      try {
        dateInput.showPicker();
      } catch {
        dateInput.focus();
      }
    }
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);

    if (endDate && value && endDate < value) {
      setEndDate("");
    }
  };

  const handleOpenBooking = () => {
    openScrollPositionRef.current = window.scrollY;
    setIsOpen(true);
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

      if (mobileQuery.matches && hasScrolled) {
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
        startDate,
        endDate,
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

        <div className="sticky-booking__date-row">
          <div className="sticky-booking__dates">
            <div
              className="sticky-booking__field sticky-booking__field--date"
              onClick={() => openDatePicker(startDateInputRef)}
            >
              <label htmlFor="sticky-booking-start-date">Start Date</label>
              <input
                ref={startDateInputRef}
                className="sticky-booking__native-date"
                id="sticky-booking-start-date"
                name="startDate"
                type="date"
                tabIndex={-1}
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
              />
              <button
                className={`sticky-booking__date-value ${startDate ? "" : "sticky-booking__date-value--empty"}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openDatePicker(startDateInputRef);
                }}
              >
                {formatIndianDate(startDate)}
              </button>
            </div>

            <div
              className="sticky-booking__field sticky-booking__field--date"
              onClick={() => openDatePicker(endDateInputRef)}
            >
              <label htmlFor="sticky-booking-end-date">End Date</label>
              <input
                ref={endDateInputRef}
                className="sticky-booking__native-date"
                id="sticky-booking-end-date"
                name="endDate"
                type="date"
                min={startDate || undefined}
                tabIndex={-1}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
              <button
                className={`sticky-booking__date-value ${endDate ? "" : "sticky-booking__date-value--empty"}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openDatePicker(endDateInputRef);
                }}
              >
                {formatIndianDate(endDate)}
              </button>
            </div>
          </div>

          <button
            className="sticky-booking__submit"
            type="submit"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Sending..." : isSent ? "Sent" : "Book"}
          </button>
        </div>

        {submitError ? (
          <p className="sticky-booking__error" role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </aside>
  );
}
