export const LODGE_GALLERY_CONFIG = {
  sectionLabel: "Glimpses of Jawai",
  sectionIntro:
    "Among Jawai's ancient granite hills and still lakes — leopard country, shared with Rabari herders — Bijapur Lodge is a quiet base for safaris, sunsets, and slow wilderness days.",
  autoScrollSpeed: 72,
};

const imageModules = import.meta.glob("../../assets/lodges/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});

const getImageNumber = (path) => {
  const match = path.match(/-(\d+)\.(jpg|jpeg|png|webp)$/i);

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

export const lodgeImages = Object.entries(imageModules)
  .map(([path, url], index) => {
    const imageNumber = getImageNumber(path);

    return {
      id: `bijapur-lodge-${imageNumber || index + 1}`,
      imageNumber,
      src: url,
      title: `Bijapur Lodge ${imageNumber || index + 1}`,
      alt: `Bijapur Lodge view ${imageNumber || index + 1}`,
    };
  })
  .sort((firstImage, secondImage) => firstImage.imageNumber - secondImage.imageNumber);
