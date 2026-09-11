import { useEffect } from "react";
import "./ThankYouPage.css";

export default function ThankYouPage({ redirectDelay = 3000, redirectUrl }) {
  useEffect(() => {
    if (!redirectUrl) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(redirectUrl);
    }, redirectDelay);

    return () => window.clearTimeout(redirectTimer);
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
