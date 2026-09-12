import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import HeroBanner from "../sections/HeroBanner/HeroBanner.jsx";
import LodgeShowcase from "../sections/LodgeShowcase/LodgeShowcase.jsx";
import ThankYouPage from "../pages/ThankYouPage/ThankYouPage.jsx";
import { initializeMetaPixel, trackMetaPageView } from "../services/metaPixel.js";
import "./App.css";

const ROUTE_TRANSITION_DURATION = 420;
const THANK_YOU_REDIRECT_DELAY = 3000;
const STAYFLEXI_BOOKING_URL = "https://bookingengine.stayflexi.com/?hotel_id=39240";
const THANK_YOU_PAGE = "thank-you";
const LANDING_PAGE = "landing";
const HOME_PATH = import.meta.env.BASE_URL || "/";
const CLEAN_HOME_PATH = HOME_PATH.endsWith("/") ? HOME_PATH : `${HOME_PATH}/`;
const THANK_YOU_PATH = `${CLEAN_HOME_PATH}thank-you`;
const THANK_YOU_ACCESS_KEY = "bijapurLodgeBookingComplete";
const THANK_YOU_ROUTE_STATE = {
  [THANK_YOU_ACCESS_KEY]: true,
};

const normalizePath = (path) => path.replace(/\/+$/, "") || "/";

const isThankYouRoute = () => (
  window.location.hash === "#thank-you" ||
  normalizePath(window.location.pathname) === normalizePath(THANK_YOU_PATH)
);

const hasThankYouAccess = () => Boolean(window.history.state?.[THANK_YOU_ACCESS_KEY]);

const getPageFromLocation = () => (
  isThankYouRoute() && hasThankYouAccess() ? THANK_YOU_PAGE : LANDING_PAGE
);

const removeLegacyThankYouHash = () => {
  if (window.location.hash === "#thank-you") {
    window.history.replaceState(window.history.state, "", THANK_YOU_PATH);
  }
};

const redirectRestrictedThankYouRoute = () => {
  if (isThankYouRoute() && !hasThankYouAccess()) {
    window.history.replaceState(null, "", CLEAN_HOME_PATH);
    return true;
  }

  return false;
};

export default function App() {
  const transitionTimeoutRef = useRef(null);
  const transitionFrameRef = useRef(null);
  const hasTrackedLandingPageRef = useRef(false);
  const [activePage, setActivePage] = useState(getPageFromLocation);
  const [transitionState, setTransitionState] = useState("entered");

  const transitionToPage = useCallback((nextPage, options = {}) => {
    const { path, updatePath = false, historyState = null } = options;
    const shouldUpdatePath =
      updatePath &&
      path &&
      (
        normalizePath(window.location.pathname) !== normalizePath(path) ||
        window.location.search ||
        window.location.hash ||
        historyState
      );

    if (shouldUpdatePath) {
      window.history.pushState(historyState, "", path);
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
    const syncPageWithLocation = () => {
      removeLegacyThankYouHash();

      if (redirectRestrictedThankYouRoute()) {
        transitionToPage(LANDING_PAGE);
        return;
      }

      transitionToPage(getPageFromLocation());
    };

    syncPageWithLocation();

    window.addEventListener("hashchange", syncPageWithLocation);
    window.addEventListener("popstate", syncPageWithLocation);

    return () => {
      window.removeEventListener("hashchange", syncPageWithLocation);
      window.removeEventListener("popstate", syncPageWithLocation);
    };
  }, [transitionToPage]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimeoutRef.current);

    if (transitionFrameRef.current) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }
  }, []);

  useEffect(() => {
    initializeMetaPixel();
  }, []);

  useEffect(() => {
    if (activePage !== LANDING_PAGE || hasTrackedLandingPageRef.current) {
      return;
    }

    hasTrackedLandingPageRef.current = true;
    trackMetaPageView("Landing");
  }, [activePage]);

  const handleBookingComplete = (bookingResult) => {
    if (
      bookingResult?.ok !== true
      || !bookingResult?.bookingId
    ) {
      return;
    }

    transitionToPage(THANK_YOU_PAGE, {
      path: THANK_YOU_PATH,
      updatePath: true,
      historyState: THANK_YOU_ROUTE_STATE,
    });
  };

  const isThankYouPage = activePage === THANK_YOU_PAGE;

  return (
    <div className="app-shell">
      <Header onBookingComplete={handleBookingComplete} hideBooking={isThankYouPage} />
      <div className={`app-route app-route--${transitionState}`}>
        {isThankYouPage ? (
          <ThankYouPage
            redirectDelay={THANK_YOU_REDIRECT_DELAY}
            redirectUrl={STAYFLEXI_BOOKING_URL}
          />
        ) : (
          <>
            <main>
              <HeroBanner />
              <LodgeShowcase />
            </main>
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
