import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Coffee, Phone } from "lucide-react";
import MenuSection from "../components/site/MenuSection";
import Reveal from "../components/Reveal";

export default function TableMenuPage() {
  const { tableNo } = useParams();
  const digits = (tableNo ?? "").replace(/\D/g, "").slice(0, 3);
  const table = digits === "" ? "1" : digits;

  useEffect(() => {
    const previous = document.title;
    document.title = `Masa ${table} · Boss Cafe Menü`;
    return () => {
      document.title = previous;
    };
  }, [table]);

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-50 border-b border-espresso-700/10 bg-cream-100/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-3 md:h-20">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-espresso-700 text-caramel-400">
              <Coffee className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold text-espresso-800">
                Boss Cafe
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-espresso-500/80">
                Eleşkirt
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-caramel-500/40 bg-caramel-500/10 px-3 py-1.5 text-xs font-semibold text-espresso-700">
              Masa {table}
            </span>
            <a
              href="tel:+904722153040"
              className="btn btn-outline btn-sm"
              aria-label="Garson çağırmak için bizi arayın"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Garson Çağır</span>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="container-page pt-8 md:pt-12">
          <Reveal variant="scale">
            <div className="rounded-3xl border border-espresso-700/10 bg-white/70 p-6 shadow-soft sm:p-8">
              <span className="section-eyebrow">Masa {table} · Hoş geldiniz</span>
              <h1 className="mt-4 font-serif text-3xl leading-tight text-espresso-800 sm:text-4xl">
                Masanızdan Menüye Hoş Geldiniz
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-espresso-800/70 sm:text-base">
                Kahve, çay, tatlı, nargile ve okey salonu — hepsi bir arada.
                Fiyatlar ve stok durumu anlık güncellenir; siparişiniz için
                garsona haber vermeniz yeterli.
              </p>
            </div>
          </Reveal>
        </section>

        <MenuSection
          eyebrow={`Masa ${table} Menüsü`}
          title="Ne Arzu Edersiniz?"
          description="Aradığınız ürünü yazın veya kategori seçin. Tükendi etiketli ürünler o an hazırlanamıyor demektir."
        />
      </main>

      <footer className="border-t border-espresso-700/10 bg-cream-100 py-8">
        <div className="container-page flex flex-col items-center gap-2 text-center text-xs text-espresso-800/60 sm:flex-row sm:justify-between sm:text-left">
          <p>Cumhuriyet Caddesi No: 42/A, Merkez / Eleşkirt</p>
          <p>
            +90 472 215 30 40 ·{" "}
            <a
              href="https://www.instagram.com/bosscafe"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-caramel-600"
            >
              @bosscafe
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
