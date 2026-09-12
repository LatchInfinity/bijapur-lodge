import { useEffect } from "react";
import { isMetaPixelEnabled, trackMetaBookButton } from "../../services/metaPixel.js";
import "./ThankYouPage.css";

const PIXEL_FLUSH_WAIT_MS = 1200;
const PIXEL_POLL_INTERVAL_MS = 150;
const PIXEL_MAX_EXTRA_WAIT_MS = 2000;

const hasPixelLibraryLoaded = () => (
  typeof window !== "undefined" && typeof window.fbq?.callMethod === "function"
);

export default function ThankYouPage({ redirectDelay = 3000, redirectUrl }) {
  useEffect(() => {
    trackMetaBookButton();
  }, []);

  useEffect(() => {
    if (!redirectUrl) {
      return undefined;
    }

    const timers = [];
    let hasRedirected = false;

    const redirect = () => {
      if (hasRedirected) {
        return;
      }

      hasRedirected = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.location.assign(redirectUrl);
    };

    const waitForPixelFlush = () => {
      if (!isMetaPixelEnabled() || hasPixelLibraryLoaded()) {
        timers.push(window.setTimeout(redirect, isMetaPixelEnabled() ? PIXEL_FLUSH_WAIT_MS : 0));
        return;
      }

      timers.push(window.setTimeout(waitForPixelFlush, PIXEL_POLL_INTERVAL_MS));
    };

    timers.push(window.setTimeout(waitForPixelFlush, redirectDelay));
    timers.push(window.setTimeout(redirect, redirectDelay + PIXEL_MAX_EXTRA_WAIT_MS));

    return () => {
      hasRedirected = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [redirectDelay, redirectUrl]);

  return (
    <main className="thank-you-page">
      <section className="thank-you-page__content page-gutter" aria-labelledby="thank-you-heading">
        <p className="thank-you-page__eyebrow">Booking Request Received</p>
        <h1 className="thank-you-page__title" id="thank-you-heading">
          Thank you.
        </h1>
        <p className="thank-you-page__copy">
          Redirecting you to complete your booking.
        </p>
      </section>
    </main>
  );
}
