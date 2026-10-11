import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<string | null>;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Evet, sil",
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await onConfirm();
    setBusy(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-3xl border border-espresso-700/10 bg-cream-50 p-6 shadow-lift"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-espresso-700/8 text-caramel-600">
          <TriangleAlert className="h-5 w-5" />
        </span>
        <h2 id="confirm-title" className="mt-4 font-serif text-xl text-espresso-800">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-espresso-800/70">
          {message}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-espresso-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="btn btn-sm bg-espresso-700 text-cream-100 hover:bg-espresso-800"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Siliniyor…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
