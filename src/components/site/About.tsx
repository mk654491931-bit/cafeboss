import { Coffee, Dices, Flame, Leaf, Wind } from "lucide-react";
import Reveal from "../Reveal";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80";

const PILLARS = [
  {
    icon: Leaf,
    title: "Yerel Tedarik",
    text: "Süt, tahıl ve tatlı malzemelerini bölgedeki üreticilerden her hafta taze getiriyoruz.",
  },
  {
    icon: Flame,
    title: "Kendi Kavurduğumuz",
    text: "Kahve çekirdeklerini küçük partiler halinde kavurup dengeli aromayı koruyoruz.",
  },
  {
    icon: Coffee,
    title: "Ustalıkla Demlenen",
    text: "Fincanlar kadar çaylar da ölçüsünde: her demlik taze, her bardak aynı lezzette.",
  },
  {
    icon: Wind,
    title: "Ocakbaşı Nargile",
    text: "Günlük hazırlanan tütünler ve tek kullanımlık başlıklarla keyifli bir mola.",
  },
  {
    icon: Dices,
    title: "Okey Salonu",
    text: "Modern masalar ve rahat koltuklarla ferah bir okey salonu; çay servisi masaya.",
  },
];

const STATS = [
  { value: "2025", label: "Eleşkirt'te açıldı" },
  { value: "7 kategori", label: "Kahve, çay, tatlı, nargile, okey…" },
  { value: "%100", label: "Taze kavrum" },
  { value: "4.8★", label: "Misafir puanı" },
];

export default function About() {
  return (
    <section id="hakkimizda" className="section bg-cream-100">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <span className="section-eyebrow">Hakkımızda</span>
            <h2 className="section-title mt-5">
              Fincanınızda ve Demliğinizde Aynı Özen
            </h2>
            <p className="mt-5 text-base leading-relaxed text-espresso-800/70 sm:text-lg">
              Boss Cafe, 2025 yılında Ferhat Kösedağ'ın öncülüğünde Eleşkirt'te
              modern tarzda bir cafe ve okey salonu açtı. Kahvemizi kendimiz
              kavuruyor, demlikten taze çay sunuyor, tatlılarımızı kendi
              mutfağımızda hazırlıyor, ocakbaşında nargile keyfini ve okey
              salonumuzda dost sohbetlerini ağırlıyoruz.
            </p>
            <p className="mt-4 font-serif text-lg italic leading-relaxed text-espresso-700 sm:text-xl">
              Kapıdan girdiğinizde sizi bir fincan değil, koca bir mola
              bekliyor.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal variant="left" className="lg:order-2">
            <div className="card overflow-hidden">
              <img
                src={ABOUT_IMAGE}
                alt="Barista fincana süt döküyor"
                loading="lazy"
                className="h-64 w-full object-cover sm:h-80"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="grid gap-5 p-6 sm:p-8">
                {PILLARS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-espresso-700/8 text-caramel-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg text-espresso-800">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-espresso-800/65">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal variant="right" delay={120} className="lg:order-1">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="card p-6 transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <p className="font-serif text-3xl text-espresso-700">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-espresso-800/60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <blockquote className="mt-6 rounded-2xl border-l-4 border-caramel-500 bg-white/60 p-6 font-serif text-lg italic leading-relaxed text-espresso-700">
              “İyi kahve acele etmez; fincanın etrafında bir sohbet, bir sofra,
              biraz nargile ve mutlaka bir okey masası bırakır.”
              <footer className="mt-3 font-sans text-sm not-italic text-espresso-800/60">
                — Ferhat Kösedağ, Kurucu
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
