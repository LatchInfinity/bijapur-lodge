import { useEffect, useState } from "react";
import "./Header.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__inner content-width page-gutter">
        <a className="site-header__brand" href="#hero" aria-label="Bijapur Lodge home">
          <span className="site-header__brand-text">Bijapur Lodge</span>
        </a>
      </div>
    </header>
  );
}
