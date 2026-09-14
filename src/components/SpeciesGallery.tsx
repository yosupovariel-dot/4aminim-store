import Image from "next/image";

type GalleryPhoto = { url: string; alt: string };

const COMPLETE_SET: GalleryPhoto[] = [{ url: "/images/gallery-complete-set-1.jpg", alt: "סט ארבעת המינים ארוז" }];

const ETROG: GalleryPhoto[] = [
  { url: "/images/gallery-etrog-1.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-2.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-3.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-4.jpg", alt: "אתרוג" },
  { url: "/images/gallery-etrog-5.jpg", alt: "אתרוג" },
];

const LULAV: GalleryPhoto[] = [{ url: "/images/gallery-lulav-2.jpg", alt: "לולבים ארוזים" }];

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
        <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">מהמלאי שלנו</h2>
        <p className="mt-2 text-emerald-700">תמונות אמיתיות שצילמנו — לולב וסט שלם, ומבחר אתרוגים.</p>
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
      </div>
    </section>
  );
}
