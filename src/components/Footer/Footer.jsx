import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer page-gutter" id="contact">
      <div className="site-footer__inner content-width">
        <div className="site-footer__brand-block">
          <a className="site-footer__brand" href="#hero">
            Bijapur Lodge
          </a>
          <p className="site-footer__copy">
            A composed landing page foundation for a nature-led lodge experience.
          </p>
        </div>

        <address className="site-footer__contact">
          <a className="site-footer__contact-item" href="tel:+910000000000">
            <span>+91 00000 00000</span>
          </a>
          <a className="site-footer__contact-item" href="mailto:stay@bijapurlodge.com">
            <span>stay@bijapurlodge.com</span>
          </a>
          <span className="site-footer__contact-item">
            <span>Bijapur Lodge</span>
          </span>
        </address>
      </div>

      <div className="site-footer__bottom content-width">
        <span>© {new Date().getFullYear()} Bijapur Lodge</span>
        <span>Built for quiet arrivals and scenic stays.</span>
      </div>
    </footer>
  );
}
