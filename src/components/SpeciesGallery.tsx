import Image from "next/image";

type GalleryPhoto = { url: string; alt: string };

const LULAV: GalleryPhoto[] = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/0/03/Lulavim.jpg", alt: "לולבים" },
];

const HADAS: GalleryPhoto[] = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Hadassim2.JPG", alt: "הדסים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/d/db/Hadassim_closeup.JPG", alt: "הדסים בתקריב" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Hadassim.JPG", alt: "הדסים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/0/03/%D7%94%D7%93%D7%A1%D7%99%D7%9D.jpg", alt: "הדסים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Hadas1.jpg", alt: "הדס" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Hadas2.jpg", alt: "הדס" },
];

const ARAVA: GalleryPhoto[] = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Arava_closeup.JPG", alt: "ערבה בתקריב" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Aravot.JPG", alt: "ערבות" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Aravos.JPG", alt: "ערבות" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/e/e2/%D7%A2%D7%A8%D7%91%D7%95%D7%AA.jpg", alt: "ערבות" },
];

const ETROG_EXTRA: GalleryPhoto[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Halved_seedless_Moroccan_citron.jpg",
    alt: "אתרוג פרוס, ללא זרעים",
  },
];

function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
      {photos.map((p) => (
        <div
          key={p.url}
          className="relative aspect-square overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50"
        >
          <Image src={p.url} alt={p.alt} fill sizes="160px" className="object-contain p-1.5" />
        </div>
      ))}
    </div>
  );
}

export function SpeciesGallery() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">ארבעת המינים מקרוב</h2>
        <p className="mt-2 text-emerald-700">
          לולב, הדס, ערבה ואתרוג — תמונות אמיתיות של המינים שבכל סט.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">לולב</h3>
          <PhotoGrid photos={LULAV} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">הדס</h3>
          <PhotoGrid photos={HADAS} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">ערבה</h3>
          <PhotoGrid photos={ARAVA} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">אתרוג</h3>
          <PhotoGrid photos={ETROG_EXTRA} />
        </div>
      </div>
    </section>
  );
}
