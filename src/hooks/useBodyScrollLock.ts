import { useEffect } from "react";

/**
 * Modal açıkken arka plandaki sayfanın kaymasını engeller. iOS Safari'de
 * gövde kaydırması kilitlenmediği için alt sayfa modallarında dokunuş
 * kaymaları yaşanıyordu; bu kanca tüm cihazlarda aynı davranışı verir.
 */
export function useBodyScrollLock(active = true): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [active]);
}
