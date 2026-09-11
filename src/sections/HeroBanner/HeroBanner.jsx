import desktopHeroFrame from "../../../assets/pc-frames/frame_002.jpg";
import mobileHeroFrame from "../../../assets/mobile-frames/frame_002.jpg";
import "./HeroBanner.css";

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
      <picture className="hero-banner__picture">
        <source srcSet={mobileHeroFrame} media="(max-width: 640px)" />
        <img
          className="hero-banner__image"
          src={desktopHeroFrame}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
    </section>
  );
}
