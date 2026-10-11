import { useState } from "react";
import { Timer } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { categoryIcon } from "../../lib/categoryIcons";
import type { Product } from "../../lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const available = product.is_available;
  const hasImage = Boolean(product.image_url) && !imageFailed;
  const Icon = categoryIcon(product.category);

  return (
    <article
      className={`card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
        available ? "" : "bg-white/50"
      }`}
    >
      <div className="relative h-44 overflow-hidden bg-espresso-700/10">
        {hasImage ? (
          <img
            src={product.image_url ?? ""}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              available ? "" : "saturate-50"
            }`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900 text-caramel-400">
            <Icon className="h-10 w-10 opacity-80" />
          </div>
        )}

        {!available && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold tracking-wide text-cream-100 shadow-soft backdrop-blur">
            Tükendi
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-cream-100/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-espresso-600 backdrop-blur">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg leading-snug text-espresso-800">
            {product.name}
          </h3>
          <span className="whitespace-nowrap rounded-lg bg-espresso-700/6 px-2.5 py-1 text-sm font-semibold text-espresso-700">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-espresso-800/65">
          {product.description}
        </p>

        {!available && (
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md bg-espresso-800/6 px-2.5 py-1.5 text-[11px] font-medium text-espresso-600">
            <Timer className="h-3.5 w-3.5" />
            Yakında tekrar hazır
          </span>
        )}
      </div>
    </article>
  );
}
