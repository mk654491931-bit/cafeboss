import { ChevronDown, Coffee, Dices, MapPin, Sparkles } from "lucide-react";
import Parallax from "../Parallax";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80";

const HIGHLIGHTS = [
  { icon: Coffee, text: "Günlük taze çekirdek" },
  { icon: Sparkles, text: "El yapımı tatlılar" },
  { icon: Dices, text: "Okey salonu" },
  { icon: MapPin, text: "Eleşkirt'in merkezinde" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-espresso-900 md:min-h-[calc(100vh-5rem)]"
    >
      <Parallax
        src={HERO_IMAGE}
        alt="Sıcak ışıklı kafe iç mekânı"
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-espresso-900 via-espresso-900/85 to-espresso-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-espresso-900 via-transparent to-espresso-900/40" />

      <div className="container-page relative py-24 md:py-32">
        <div className="max-w-3xl">
          <span className="reveal is-visible inline-flex items-center gap-2 rounded-full border border-cream-100/25 bg-cream-100/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-caramel-400" />
            Kahve • Çay • Tatlı • Nargile • Okey
          </span>

          <h1 className="reveal is-visible mt-6 font-serif text-4xl leading-[1.05] text-cream-50 sm:text-5xl md:text-7xl">
            Her Yudumda
            <span className="block text-caramel-400">Taze Bir Hikaye</span>
          </h1>

          <p
            className="reveal is-visible mt-6 max-w-xl text-base leading-relaxed text-cream-200/85 sm:text-lg"
            style={{ transitionDelay: "120ms" }}
          >
            Boss Cafe'de kendi kavurduğumuz çekirdekler, demlikten taze çaylar,
            ev yapımı tatlılar, ocakbaşı nargile ve modern bir okey salonu bir
            arada. Eleşkirt'in merkezinde, günün ritmini yavaşlatın.
          </p>

          <div
            className="reveal is-visible mt-9 flex flex-wrap gap-3 sm:gap-4"
            style={{ transitionDelay: "220ms" }}
          >
            <a href="#menu" className="btn btn-accent">
              Menüyü İncele
            </a>
            <a href="#iletisim" className="btn btn-light">
              <MapPin className="h-4 w-4" />
              Konum Al
            </a>
          </div>

          <ul
            className="reveal is-visible mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-cream-100/15 pt-6"
            style={{ transitionDelay: "320ms" }}
          >
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-cream-200/75 sm:text-sm"
              >
                <Icon className="h-4 w-4 text-caramel-400" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a
        href="#hakkimizda"
        aria-label="Aşağı kaydır: hakkımızda bölümü"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream-200/70 transition hover:text-caramel-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 md:flex"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
          Kaydır
        </span>
        <ChevronDown className="scroll-cue h-5 w-5" />
      </a>
    </section>
  );
}
