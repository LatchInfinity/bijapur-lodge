import "./ThankYouPage.css";

export default function ThankYouPage({ homeHref, onBack }) {
  return (
    <main className="thank-you-page">
      <section className="thank-you-page__content page-gutter" aria-labelledby="thank-you-heading">
        <p className="thank-you-page__eyebrow">Booking Request Received</p>
        <h1 className="thank-you-page__title" id="thank-you-heading">
          Thank you.
        </h1>
        <p className="thank-you-page__copy">
          We will reach out to you shortly.
        </p>
        <a
          className="thank-you-page__link"
          href={homeHref}
          onClick={(event) => {
            event.preventDefault();
            onBack?.();
          }}
        >
          Back to Home
        </a>
      </section>
    </main>
  );
}
