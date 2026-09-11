import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightYears = currentYear > 2021 ? `2021–${currentYear}` : "2021";

  return (
    <footer className="site-footer page-gutter" id="contact">
      <div className="site-footer__inner content-width">
        <div className="site-footer__brand-block">
          <a className="site-footer__brand" href="#hero">
            Bijapur Lodge
          </a>
          <p className="site-footer__copy">
            Where rocky trails, open skies, and quiet stays meet nature.
          </p>
        </div>

        <address className="site-footer__contact">
          <a className="site-footer__contact-item" href="tel:+910000000000">
            <span>+91 95888 62457</span>
          </a>
          <a className="site-footer__contact-item" href="mailto:stay@bijapurlodge.com">
            <span>reservations@bijapurlodge.com</span>
          </a>
         
        </address>
      </div>

      <div className="site-footer__bottom content-width">
        <span>© {copyrightYears} Bijapur Lodge</span>
        <span>Built for quiet arrivals and scenic stays.</span>
      </div>
    </footer>
  );
}
