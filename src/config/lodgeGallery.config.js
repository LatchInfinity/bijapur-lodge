export const LODGE_GALLERY_CONFIG = {
  sectionLabel: "Glimpses of Jawai",
  sectionIntro:
    "Among Jawai’s ancient granite hills and still waters, life moves at its own pace. Leopards share the landscape with Rabari herders, and the days unfold through quiet safaris, open skies and unhurried moments in the wild.",
  sectionIntroSecond:
    "Bijapur Lodge by Zari offers an intimate way to experience it all - quietly and at your own rhythm.",
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
