import { useEffect, useRef, useState } from "react";

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
  // Dokunmatik telefonlarda parallax kapalı: görsel ne büyütülür ne de her
  // kaydırma karesinde yeniden çizilir. Masaüstünde de React state'i yerine
  // doğrudan DOM transform'u güncellenir.
  const [enabled, setEnabled] = useState(canParallax);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(PARALLAX_QUERY);
    const onChange = (event: MediaQueryListEvent) => setEnabled(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    if (!enabled) {
      image.style.transform = "scale(1)";
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      image.style.transform = `translate3d(0, ${Math.round(window.scrollY * strength)}px, 0) scale(1.15)`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled, strength]);

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={`${enabled ? "will-change-transform" : ""} ${className}`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}
