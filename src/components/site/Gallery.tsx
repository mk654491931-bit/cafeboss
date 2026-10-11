import Reveal from "../Reveal";

interface Shot {
  src: string;
  alt: string;
  caption: string;
}

const SHOTS: Shot[] = [
  {
    src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
    alt: "Ahşap masalı sıcak kafe iç mekânı",
    caption: "İç Mekân",
  },
  {
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    alt: "Latte art ile süslenmiş fincan",
    caption: "İmza Latte",
  },
  {
    src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
    alt: "Kahve yanında taze sandviç",
    caption: "Atıştırmalıklar",
  },
  {
    src: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
    alt: "Cam bardakta filtre kahve",
    caption: "Filtre Demleme",
  },
  {
    src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
    alt: "Kafe barında kahve ekipmanları",
    caption: "Barista Tezgâhı",
  },
  {
    src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    alt: "Taze pişmiş hamur işleri",
    caption: "Tatlı Vitrini",
  },
];

export default function Gallery() {
  return (
    <section id="galeri" className="section bg-cream-100">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">Galeri</span>
              <h2 className="section-title mt-5">Mekândan Kareler</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-espresso-800/65 sm:text-base">
              Ahşabın sıcaklığı, kahvenin kokusu ve fincanın tınısı —
              Eleşkirt'teki köşemizden kareler.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {SHOTS.map((shot, index) => (
            <Reveal
              key={shot.src}
              variant={index % 3 === 0 ? "left" : index % 3 === 1 ? "up" : "right"}
              delay={(index % 3) * 90}
            >
              <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-espresso-700/10 shadow-soft">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/85 via-espresso-900/10 to-transparent opacity-80 transition group-hover:opacity-95" />
                <figcaption className="absolute inset-x-4 bottom-4 translate-y-1 text-cream-50 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="font-serif text-base">{shot.caption}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
