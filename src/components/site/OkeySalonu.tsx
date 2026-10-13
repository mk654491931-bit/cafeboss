import { Armchair, Coffee, Dices, Phone } from "lucide-react";
import Reveal from "../Reveal";

const FEATURES = [
  {
    icon: Dices,
    title: "Modern Masalar",
    text: "Dört kişilik, bakımlı ve rahat okey masaları.",
  },
  {
    icon: Armchair,
    title: "Ferah Salon",
    text: "Klimalı, geniş oturma alanlı ve sigara içilmeyen salon.",
  },
  {
    icon: Coffee,
    title: "Dostlarla Keyifli Mola",
    text: "Acele yok — kahvenizi yudumlayın, taşlarınızı çekin, sohbetiniz bol olsun.",
  },
];

export default function OkeySalonu() {
  return (
    <section id="okey" className="section bg-cream-200/50">
      <div className="container-page">
        <Reveal variant="scale">
          <div className="overflow-hidden rounded-3xl bg-espresso-800 p-6 text-cream-100 shadow-lift sm:p-10 md:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cream-100/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-caramel-400">
                  Okey Salonu
                </span>
                <h2 className="mt-5 font-serif text-3xl leading-tight text-cream-50 sm:text-4xl">
                  Modern Cafe, Keyifli Okey
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-200/80 sm:text-base">
                  Boss Cafe'de kahvenin yanında bir de okey var. Ferah salonumuzda
                  modern masalar, rahat koltuklar ve masaya çay servisi sizi
                  bekliyor — dostlarınızla günün yorgunluğunu atın.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="tel:+905313467730" className="btn btn-accent">
                    <Phone className="h-4 w-4" />
                    Masa Rezervasyonu
                  </a>
                  <a href="#menu" className="btn btn-light">
                    Menüyü Gör
                  </a>
                </div>
                <p className="mt-6 max-w-xl font-serif text-base italic leading-relaxed text-cream-200/75 sm:text-lg">
                  Kalabalık akşamlarda gelmeden bir telefon etmeniz yeter;
                  masanızı hazır tutarız.
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li
                    key={title}
                    className="flex gap-4 rounded-2xl border border-cream-100/10 bg-cream-100/5 p-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-500/15 text-caramel-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg text-cream-50">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-cream-200/70">
                        {text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
