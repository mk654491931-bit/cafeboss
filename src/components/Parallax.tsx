import { useScrollY } from "../hooks/useScrollEffects";

interface ParallaxProps {
  src: string;
  alt: string;
  /** Fraction of the scroll offset applied as vertical translation. */
  strength?: number;
  className?: string;
}

export default function Parallax({
  src,
  alt,
  strength = 0.18,
  className = "",
}: ParallaxProps) {
  const offset = useScrollY();

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
