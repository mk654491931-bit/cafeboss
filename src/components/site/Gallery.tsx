import Reveal from "../Reveal";
import { useGallery } from "../../hooks/useGallery";

export default function Gallery() {
  const { images } = useGallery();
  const shots = images.filter((image) => image.src.trim().length > 0);

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
          {shots.map((shot, index) => (
            <Reveal
              key={shot.id}
              variant={index % 3 === 0 ? "left" : index % 3 === 1 ? "up" : "right"}
              delay={(index % 3) * 90}
            >
              <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-espresso-700/10 shadow-soft">
                <img
                  src={shot.src}
                  alt={shot.alt || shot.caption}
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

        {shots.length > 0 && (
          <p className="mt-10 text-center font-serif text-base italic leading-relaxed text-espresso-800/70">
            Her kare, burada geçirilmiş güzel bir saatten bir hatıra.
          </p>
        )}
      </div>
    </section>
  );
}
