import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StickyBooking from "../components/StickyBooking/StickyBooking.jsx";
import HeroBanner from "../sections/HeroBanner/HeroBanner.jsx";
import LodgeShowcase from "../sections/LodgeShowcase/LodgeShowcase.jsx";
import ThankYouPage from "../pages/ThankYouPage/ThankYouPage.jsx";
import "./App.css";

const ROUTE_TRANSITION_DURATION = 420;
const THANK_YOU_PAGE = "thank-you";
const LANDING_PAGE = "landing";
const HOME_PATH = import.meta.env.BASE_URL || "/";

const getPageFromHash = () => (
  window.location.hash === "#thank-you" ? THANK_YOU_PAGE : LANDING_PAGE
);

export default function App() {
  const transitionTimeoutRef = useRef(null);
  const transitionFrameRef = useRef(null);
  const [activePage, setActivePage] = useState(getPageFromHash);
  const [transitionState, setTransitionState] = useState("entered");

  const transitionToPage = useCallback((nextPage, options = {}) => {
    const { hash, updateHash = false } = options;

    if (updateHash && hash && window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }

    if (nextPage === activePage) {
      return;
    }

    window.clearTimeout(transitionTimeoutRef.current);

    if (transitionFrameRef.current) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }

    setTransitionState("exiting");

    transitionTimeoutRef.current = window.setTimeout(() => {
      setActivePage(nextPage);
      window.scrollTo({ top: 0, behavior: "auto" });
      setTransitionState("entering");

      transitionFrameRef.current = window.requestAnimationFrame(() => {
        setTransitionState("entered");
      });
    }, ROUTE_TRANSITION_DURATION);
  }, [activePage]);

  useEffect(() => {
    const updatePageFromHash = () => {
      transitionToPage(getPageFromHash());
    };

    window.addEventListener("hashchange", updatePageFromHash);
    window.addEventListener("popstate", updatePageFromHash);

    return () => {
      window.removeEventListener("hashchange", updatePageFromHash);
      window.removeEventListener("popstate", updatePageFromHash);
    };
  }, [transitionToPage]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimeoutRef.current);

    if (transitionFrameRef.current) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }
  }, []);

  const handleBookingComplete = () => {
    transitionToPage(THANK_YOU_PAGE, { hash: "#thank-you", updateHash: true });
  };

  const handleThankYouExit = () => {
    if (window.location.hash) {
      window.history.pushState(null, "", HOME_PATH);
    }

    transitionToPage(LANDING_PAGE);
  };

  const isThankYouPage = activePage === THANK_YOU_PAGE;

  return (
    <div className="app-shell">
      <Header />
      <div className={`app-route app-route--${transitionState}`}>
        {isThankYouPage ? (
          <ThankYouPage homeHref={HOME_PATH} onBack={handleThankYouExit} />
        ) : (
          <>
            <main>
              <HeroBanner />
              <LodgeShowcase />
            </main>
            <Footer />
            <StickyBooking onBookingComplete={handleBookingComplete} />
          </>
        )}
      </div>
    </div>
  );
}
