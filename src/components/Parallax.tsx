import { useEffect, useState } from "react";
import { useScrollY } from "../hooks/useScrollEffects";

interface ParallaxProps {
  src: string;
  alt: string;
  /** Fraction of the scroll offset applied as vertical translation. */
  strength?: number;
  className?: string;
}

const PARALLAX_QUERY =
  "(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)";

function canParallax(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(PARALLAX_QUERY).matches;
}

export default function Parallax({
  src,
  alt,
  strength = 0.18,
  className = "",
}: ParallaxProps) {
  // Dokunmatik telefonlarda her kaydırma karesinde yeniden çizmek yerine
  // görsel sabit kalsın; pil ve akıcılık açısından daha güvenli.
  const [enabled, setEnabled] = useState(canParallax);
  const offset = useScrollY(enabled);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(PARALLAX_QUERY);
    const onChange = (event: MediaQueryListEvent) => setEnabled(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      style={{
        transform: `translate3d(0, ${Math.round(offset * strength)}px, 0) scale(1.15)`,
      }}
      className={`will-change-transform ${className}`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}
