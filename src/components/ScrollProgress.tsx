import { useScrollProgress } from "../hooks/useScrollEffects";

export default function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-espresso-700/10"
    >
      <div
        className="h-full bg-gradient-to-r from-caramel-500 via-caramel-400 to-espresso-600 transition-[width] duration-150 ease-out"
        style={{ width: `${(progress * 100).toFixed(2)}%` }}
      />
    </div>
  );
}
