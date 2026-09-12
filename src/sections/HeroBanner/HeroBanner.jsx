import "./HeroBanner.css";

const HERO_VIDEO_ID = "UJEUwEJ6gH4";
const HERO_VIDEO_SRC = `https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_ID}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;

export default function HeroBanner() {
  return (
    <section
      className="hero-banner"
      id="hero"
      aria-labelledby="hero-heading"
    >
      <h1 className="sr-only" id="hero-heading">
        Bijapur Lodge
      </h1>
      <div className="hero-banner__media">
        <div className="hero-banner__video-wrap" aria-hidden="true">
          <iframe
            className="hero-banner__video"
            src={HERO_VIDEO_SRC}
            title="Bijapur Lodge film"
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
