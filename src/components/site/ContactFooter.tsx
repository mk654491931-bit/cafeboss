import { Clock, Dices, Instagram, Mail, MapPin, Phone, QrCode } from "lucide-react";
import Reveal from "../Reveal";

const ADDRESS = "Müftüselim Mahallesi, Ahmet Hamdi Şam Caddesi";
const MAP_QUERY =
  "M%C3%BCft%C3%BCselim%20Mahallesi%20Ahmet%20Hamdi%20%C5%9Eam%20Caddesi%20Ele%C5%9Fkirt%20A%C4%9Fr%C4%B1";
const MAP_SRC = `https://maps.google.com/maps?q=${MAP_QUERY}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
const MAP_LINK = `https://maps.google.com/?q=${MAP_QUERY}`;

const HOURS = [
  { days: "Pazartesi – Cuma", time: "08:00 – 23:30" },
  { days: "Cumartesi", time: "09:00 – 00:30" },
  { days: "Pazar", time: "09:00 – 23:00" },
];

export default function ContactFooter() {
  return (
    <footer id="iletisim" className="bg-espresso-900 text-cream-200">
      <div className="container-page section">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream-100/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-caramel-400">
              İletişim
            </span>
            <h2 className="mt-5 font-serif text-3xl leading-tight text-cream-50 sm:text-4xl md:text-5xl">
              Eleşkirt'te Bir Çay Molası Verelim
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream-200/75 sm:text-base">
              Kahve, çay, tatlı, nargile ve okey — hepsi aynı çatı altında.
              Masa ve nargile rezervasyonları için bizi arayabilirsiniz.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col gap-6 rounded-3xl border border-cream-100/10 bg-cream-100/5 p-6 sm:p-8">
              <ul className="space-y-5">
                <li className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-500/15 text-caramel-400">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-200/60">
                      Adres
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-cream-100">
                      {ADDRESS}
                      <br />
                      Eleşkirt / Ağrı
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-500/15 text-caramel-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-200/60">
                      Telefon
                    </p>
                    <a
                      href="tel:+905313467730"
                      className="mt-1 block text-sm text-cream-100 transition hover:text-caramel-400"
                    >
                      0531 346 77 30
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-500/15 text-caramel-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-200/60">
                      E-posta
                    </p>
                    <a
                      href="mailto:merhaba@bosscafe.com"
                      className="mt-1 block text-sm text-cream-100 transition hover:text-caramel-400"
                    >
                      merhaba@bosscafe.com
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-500/15 text-caramel-400">
                    <Instagram className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-200/60">
                      Sosyal
                    </p>
                    <a
                      href="https://www.instagram.com/cafe_boss04"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-sm text-cream-100 transition hover:text-caramel-400"
                    >
                      @cafe_boss04
                    </a>
                  </div>
                </li>
              </ul>

              <div className="mt-auto rounded-2xl border border-cream-100/10 bg-espresso-800/60 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-caramel-400">
                  <Clock className="h-4 w-4" />
                  Çalışma Saatleri
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  {HOURS.map((row) => (
                    <div
                      key={row.days}
                      className="flex items-center justify-between gap-4 border-b border-cream-100/5 pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="text-cream-200/75">{row.days}</dt>
                      <dd className="font-medium text-cream-100">{row.time}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-cream-200/65">
                  <Dices className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caramel-400" />
                  Okey salonumuzda masa rezervasyonu önerilir.
                </p>
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-cream-200/65">
                  <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caramel-400" />
                  Masalardaki QR kodu okutarak menüyü telefonunuzdan
                  inceleyebilirsiniz.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full overflow-hidden rounded-3xl border border-cream-100/10 bg-espresso-800">
              <div className="flex items-center justify-between gap-4 border-b border-cream-100/10 px-6 py-4">
                <p className="font-serif text-lg text-cream-50">Bizi Bulun</p>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-wider text-caramel-400 transition hover:text-caramel-300"
                >
                  Haritada Aç
                </a>
              </div>
              <div className="relative h-72 w-full sm:h-[26rem] lg:h-[calc(100%-4rem)] lg:min-h-[22rem]">
                <iframe
                  title="Boss Cafe konumu — Google Haritalar"
                  src={MAP_SRC}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.2]"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream-200/55 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Boss Cafe. Tüm hakları saklıdır. ·
            Sahibi: Ferhat Kösedağ
          </p>
          <p>Kahve • Çay • Tatlı • Nargile • Okey Salonu · Eleşkirt</p>
        </div>
      </div>
    </footer>
  );
}
