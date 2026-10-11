import { ArrowUp } from "lucide-react";
import { useScrolled } from "../hooks/useScrollEffects";

export default function BackToTop() {
  const visible = useScrolled(600);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Sayfanın başına dön"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-20 left-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-espresso-700/15 bg-cream-50/95 text-espresso-700 shadow-lift backdrop-blur transition-all duration-300 hover:bg-espresso-700 hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 sm:bottom-6 sm:left-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
