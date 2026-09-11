import { useEffect, useMemo, useRef, useState } from "react";
import { submitBooking } from "../../services/bookingApi.js";
import "./Header.css";

const getDigitsOnly = (value) => value.replace(/\D/g, "");
const getPhoneValue = (value) => getDigitsOnly(value).slice(0, 10);
const getNameValue = (value) => value.replace(/[0-9]/g, "");
const GENERIC_SUBMIT_ERROR = "We could not send your booking request. Please try again.";

const getBookingValidationError = ({ name, phoneDigits }) => {
  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return "Please enter your name.";
  }

  if (/\d/.test(trimmedName)) {
    return "Name should not contain numbers.";
  }

  if (phoneDigits.length !== 10) {
    return "Please enter a 10 digit phone number.";
  }

  return "";
};

export default function Header({ onBookingComplete }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const panelRef = useRef(null);

  const phoneDigits = useMemo(() => getDigitsOnly(phone), [phone]);
  const hasName = name.trim().length >= 2;
  const hasPhone = hasName && phoneDigits.length >= 10;
  const isSubmitting = submitStatus === "submitting";
  const isSent = submitStatus === "sent";
  const step = hasPhone ? "ready" : hasName ? "phone" : "name";
  const canSubmit = hasName && hasPhone && !isSubmitting && !isSent;

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = getBookingValidationError({ name, phoneDigits });

    if (validationError) {
      setSubmitStatus("idle");
      setSubmitError(validationError);
      return;
    }

    if (isSubmitting || isSent) {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      const result = await submitBooking({
        name: name.trim(),
        phone: phoneDigits,
        sourcePage: window.location.href,
        honeypot: website,
      });

      setSubmitStatus("sent");
      onBookingComplete?.(result);
    } catch (error) {
      setSubmitStatus("idle");
      setSubmitError(
        error instanceof Error
          ? error.message
          : GENERIC_SUBMIT_ERROR
      );
    }
  };

  return (
    <header className={`site-header ${isScrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__inner content-width page-gutter">
        <a className="site-header__brand" href="#hero" aria-label="Bijapur Lodge home">
          <span className="site-header__brand-text">Bijapur Lodge</span>
        </a>
        <button
          className="site-header__book-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="header-booking-panel"
        >
          Book Now
        </button>
      </div>

      <div
        ref={panelRef}
        id="header-booking-panel"
        className={`header-booking ${isOpen ? "header-booking--open" : ""} header-booking--step-${step}`}
      >
        <div className="header-booking__panel">

          <div className="header-booking__field header-booking__field--name">
            <label htmlFor="header-booking-name">Name</label>
            <input
              id="header-booking-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              placeholder="Your name"
              onChange={(event) => {
                setName(getNameValue(event.target.value));
                setSubmitError("");
              }}
            />
          </div>

          <div className="header-booking__field header-booking__field--phone">
            <label htmlFor="header-booking-phone">Phone Number</label>
            <input
              id="header-booking-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              placeholder="10 digit mobile number"
              maxLength={10}
              pattern="[0-9]{10}"
              onChange={(event) => {
                setPhone(getPhoneValue(event.target.value));
                setSubmitError("");
              }}
            />
          </div>

          <button
            className="header-booking__submit"
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Sending..." : isSent ? "Sent" : "Book"}
          </button>

          {submitError ? (
            <p className="header-booking__error" role="alert">
              {submitError}
            </p>
          ) : null}

        </div>
      </div>
    </header>
  );
}
