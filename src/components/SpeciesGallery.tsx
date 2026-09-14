import Image from "next/image";

type GalleryPhoto = { url: string; alt: string };

const LULAV: GalleryPhoto[] = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/0/03/Lulavim.jpg", alt: "לולבים" },
  { url: "/images/gallery-lulav-2.jpg", alt: "לולבים ארוזים" },
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

const ETROG: GalleryPhoto[] = [
  { url: "/images/gallery-etrog-1.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-2.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-3.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-4.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-5.jpg", alt: "אתרוג" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Naxos_citron.jpg", alt: "אתרוג" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/b/bf/MoroccanWSeeds.jpg", alt: "אתרוג מרוקאי" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Pushka2.JPG", alt: "אתרוג בפושקע" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/4/49/Etrog_with_Pitom.jpg", alt: "אתרוג עם פיטם" },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/35/Balady_citron_%28Braverman_cultivar%29.jpg",
    alt: "אתרוג בלדי",
  },
  { url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/MoroccanEtrog.jpg", alt: "אתרוג מרוקאי" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/0/0b/3_etrog.JPG", alt: "אתרוגים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/9/99/Citrus_medica_fruit.jpg", alt: "אתרוג" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/7/73/Citron_%28819330933%29.jpg", alt: "אתרוג" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Cedro_%28CItrus_medica%29.jpg", alt: "אתרוג" },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Halved_seedless_Moroccan_citron.jpg",
    alt: "אתרוג פרוס, ללא זרעים",
  },
];

const COMPLETE_SET: GalleryPhoto[] = [
  { url: "/images/gallery-complete-set-1.jpg", alt: "סט ארבעת המינים ארוז" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/1/10/Arbaat_haminim-new.jpg", alt: "סט ארבעת המינים" },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/%D7%A1%D7%98_%D7%90%D7%A8%D7%91%D7%A2%D7%AA_%D7%94%D7%9E%D7%99%D7%A0%D7%99%D7%9D.jpg",
    alt: "סט ארבעת המינים",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a4/%D7%9B%D7%9C_%D7%90%D7%A8%D7%91%D7%A2%D7%AA_%D7%94%D7%9E%D7%99%D7%A0%D7%99%D7%9D.jpg",
    alt: "כל ארבעת המינים",
  },
  { url: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Arbaat_haminim-2.jpg", alt: "ארבעת המינים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Arbaat_haminim.jpg", alt: "ארבעת המינים" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/1/14/Etrog_Lulav_and_Hadas.jpg", alt: "אתרוג, לולב והדס" },
];

function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
      {photos.map((p, i) => (
        <div
          key={p.url + i}
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
          לולב, הדס, ערבה ואתרוג — תמונות אמיתיות של המינים, ושל סטים שלמים כפי שהם מגיעים.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">סט שלם</h3>
          <PhotoGrid photos={COMPLETE_SET} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-emerald-800">אתרוג</h3>
          <PhotoGrid photos={ETROG} />
        </div>
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
      </div>
    </section>
  );
}
