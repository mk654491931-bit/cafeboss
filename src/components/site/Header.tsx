import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Menu as MenuIcon, X } from "lucide-react";
import { useActiveSection, useScrolled } from "../../hooks/useScrollEffects";

const NAV_ITEMS = [
  { label: "Hakkımızda", href: "#hakkimizda", id: "hakkimizda" },
  { label: "Menü", href: "#menu", id: "menu" },
  { label: "Okey Salonu", href: "#okey", id: "okey" },
  { label: "Galeri", href: "#galeri", id: "galeri" },
  { label: "İletişim", href: "#iletisim", id: "iletisim" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(24);
  const active = useActiveSection(NAV_ITEMS.map((item) => item.id));

  // Açık menü masaüstü genişliğine geçince ya da Escape'e basınca kapansın;
  // aksi hâlde görünmez bir katman açık kalabiliyordu.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onChange);
    };
  }, [open]);

  return (
    <header
      className={`pt-safe sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 lg:backdrop-blur-md ${
        scrolled
          ? "border-espresso-700/10 bg-cream-100/95 shadow-soft"
          : "border-espresso-700/5 bg-cream-100/80"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between md:h-20">
        <a
          href="#top"
          aria-label="Boss Cafe ana sayfa"
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
        >
          <img
            src="/logo.svg"
            alt="Boss Cafe"
            className={`h-10 w-auto transition-all duration-300 md:h-12 ${
              scrolled ? "scale-95" : "scale-100"
            }`}
          />
        </a>

        <nav
          className="hidden items-center gap-5 md:flex lg:gap-8"
          aria-label="Ana menü"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id && !open;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "location" : undefined}
                className={`relative text-sm font-medium transition after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-caramel-500 after:transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                  isActive
                    ? "text-espresso-900 after:w-full"
                    : "text-espresso-700/80 after:w-0 hover:text-espresso-800 hover:after:w-full"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="btn btn-outline btn-sm hidden sm:inline-flex"
          >
            <Lock className="h-3.5 w-3.5" />
            Admin Girişi
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-espresso-700/15 text-espresso-700 transition hover:bg-espresso-700 hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-espresso-700/10 bg-cream-100/95 transition-[max-height,opacity] duration-300 md:hidden ${
          open
            ? "max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain opacity-100"
            : "invisible max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <nav
          className="container-page flex flex-col gap-1 py-4"
          aria-label="Mobil menü"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-espresso-700/5 hover:text-espresso-900 ${
                active === item.id
                  ? "bg-espresso-700/5 text-espresso-900"
                  : "text-espresso-700"
              }`}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="btn btn-outline btn-sm"
          >
            <Lock className="h-3.5 w-3.5" />
            Admin Girişi
          </Link>
        </nav>
      </div>
    </header>
  );
}
