import { useEffect, useRef } from "react";

/**
 * Okuma ilerlemesi çubuğu. Her kaydırma karesinde React state'i güncellemek
 * yerine çubuğun genişliğini doğrudan DOM üzerinde değiştirir; bu, özellikle
 * telefonlarda gereksiz render ve paint yükünü önler.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.width = `${(progress * 100).toFixed(2)}%`;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-espresso-700/10"
    >
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-caramel-500 via-caramel-400 to-espresso-600"
        style={{ width: "0%" }}
      />
    </div>
  );
}
