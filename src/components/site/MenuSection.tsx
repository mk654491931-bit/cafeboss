import { useMemo, useState } from "react";
import { AlertTriangle, Coffee, RefreshCw, Search, X } from "lucide-react";
import Reveal from "../Reveal";
import ProductCard from "./ProductCard";
import { useMenu } from "../../hooks/useMenu";
import { CATEGORIES } from "../../lib/types";

const ALL = "Tümü";

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr");
}

interface MenuSectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
}

export default function MenuSection({
  eyebrow = "Dijital Menü",
  title = "Bugün Menünüzde Ne Olsun?",
  description = "Fiyatlar ve stok durumu anlık olarak güncellenir. Beğendiğiniz ürünü baristamıza sormanız yeterli.",
}: MenuSectionProps) {
  const { products, loading, error, reload } = useMenu();
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.category, (map.get(product.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const search = normalize(query.trim());
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === ALL || product.category === activeCategory;
      if (!matchesCategory) return false;
      if (!search) return true;
      return normalize(`${product.name} ${product.description ?? ""}`).includes(
        search,
      );
    });
  }, [products, activeCategory, query]);

  const tabs = [ALL, ...CATEGORIES];

  return (
    <section id="menu" className="section bg-cream-200/50">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="section-eyebrow">{eyebrow}</span>
              <h2 className="section-title mt-5">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-espresso-800/70">
                {description}
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-600/60" />
              <label htmlFor="menu-search" className="sr-only">
                Menüde ara
              </label>
              <input
                id="menu-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ürün ara: latte, sufle, tost…"
                className="input pl-11 pr-10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Aramayı temizle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-espresso-600/60 transition hover:bg-espresso-700/10 hover:text-espresso-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div
            role="tablist"
            aria-label="Menü kategorileri"
            className="no-scrollbar -mx-4 mt-9 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {tabs.map((tab) => {
              const isActive = tab === activeCategory;
              const count =
                tab === ALL ? products.length : (counts.get(tab) ?? 0);
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(tab)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                    isActive
                      ? "border-espresso-700 bg-espresso-700 text-cream-100 shadow-soft"
                      : "border-espresso-700/15 bg-white/70 text-espresso-700 hover:border-espresso-700/35 hover:bg-white"
                  }`}
                >
                  {tab}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      isActive
                        ? "bg-cream-100/20 text-cream-100"
                        : "bg-espresso-700/8 text-espresso-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {loading && (
          <div
            aria-label="Menü yükleniyor"
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="card h-72 animate-pulse overflow-hidden bg-white/50"
              >
                <div className="h-44 bg-espresso-700/10" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-espresso-700/10" />
                  <div className="h-3 w-full rounded bg-espresso-700/10" />
                  <div className="h-3 w-4/5 rounded bg-espresso-700/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-espresso-500/30 bg-white/70 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-caramel-600" />
            <p className="mt-3 font-medium text-espresso-800">
              Menü yüklenirken bir sorun oluştu.
            </p>
            <p className="mt-1 text-sm text-espresso-800/65">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="btn btn-outline btn-sm mt-5"
            >
              <RefreshCw className="h-4 w-4" />
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-espresso-700/25 bg-white/50 p-12 text-center">
            <Coffee className="mx-auto h-9 w-9 text-espresso-500/70" />
            <p className="mt-4 font-serif text-xl text-espresso-800">
              Aradığınız lezzeti bulamadık
            </p>
            <p className="mt-2 text-sm text-espresso-800/65">
              Farklı bir kategori deneyin veya arama kutusunu temizleyin.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory(ALL);
              }}
              className="btn btn-outline btn-sm mt-5"
            >
              Tüm Menüyü Göster
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            key={activeCategory}
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((product, index) => (
              <Reveal key={product.id} delay={(index % 3) * 70}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-10 text-center font-serif text-base italic leading-relaxed text-espresso-800/70">
            Aklınızdaki bir şey menüde görünmüyorsa garsona sorun; birlikte bir
            çaresine bakarız.
          </p>
        )}
      </div>
    </section>
  );
}
