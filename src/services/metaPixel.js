const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const META_PIXEL_SCRIPT_ID = "meta-pixel-script";

let isInitialized = false;
let hasTrackedLead = false;

const canUsePixel = () => (
  Boolean(META_PIXEL_ID) && typeof window !== "undefined" && typeof document !== "undefined"
);

const getFbq = () => window.fbq;

export function isMetaPixelEnabled() {
  return canUsePixel();
}

export function initializeMetaPixel() {
  if (!canUsePixel() || isInitialized) {
    return;
  }

  const existingFbq = getFbq();

  if (!existingFbq) {
    const fbq = function fbqQueue() {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };

    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
  }

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script");
    const firstScript = document.getElementsByTagName("script")[0];

    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  getFbq()("init", META_PIXEL_ID);
  isInitialized = true;
}

export function trackMetaPageView(pageName) {
  if (!canUsePixel()) {
    return;
  }

  initializeMetaPixel();
  getFbq()("track", "PageView", {
    page_name: pageName,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export function trackMetaBookButton() {
  if (!canUsePixel() || hasTrackedLead) {
    return;
  }

  hasTrackedLead = true;
  initializeMetaPixel();
  getFbq()("track", "Lead", {
    content_name: "Bijapur Lodge Book Button",
    content_category: "Lodge Stay",
  });
}
