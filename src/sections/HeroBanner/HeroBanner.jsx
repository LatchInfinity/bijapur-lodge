import "./HeroBanner.css";

const HERO_VIDEO_URL = "https://thezari.co.in/media/Hero.mp4";

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
          <video
            className="hero-banner__video"
            src={HERO_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
          />
        </div>
      </div>
    </section>
  );
}
