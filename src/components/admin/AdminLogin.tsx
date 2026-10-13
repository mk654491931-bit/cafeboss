import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Coffee, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { ADMIN_USERNAME, resolveAdminEmail, signIn } from "../../lib/auth";
import { isSupabaseConfigured, configHint } from "../../lib/supabase";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("Kullanıcı adı ve şifre alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const message = await signIn(resolveAdminEmail(trimmedUsername), password);
    setSubmitting(false);
    if (message) setError(message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-espresso-900 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(192,133,82,0.18),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-cream-200/70 transition hover:text-cream-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Siteye Dön
        </Link>

        <div className="rounded-3xl border border-cream-100/10 bg-cream-50 p-8 shadow-lift sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-espresso-700 text-caramel-400">
              <Coffee className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-serif text-2xl text-espresso-800">
                Admin Paneli
              </h1>
              <p className="text-sm text-espresso-800/60">
                Menüyü yönetmek için giriş yapın
              </p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-espresso-500/30 bg-espresso-700/5 p-4 text-sm text-espresso-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
              <p>{configHint}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="admin-username" className="field-label">
                Kullanıcı Adı
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={ADMIN_USERNAME}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="field-label">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-espresso-600/70 transition hover:bg-espresso-700/10 hover:text-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-espresso-500/25 bg-espresso-700/5 px-4 py-3 text-sm text-espresso-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
              className="btn btn-primary w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Giriş yapılıyor…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-espresso-800/55">
            Bu alan yalnızca Boss Cafe yöneticileri içindir. Tüm oturumlar
            Supabase Auth ile güvenli şekilde doğrulanır.
          </p>
        </div>
      </div>
    </div>
  );
}
