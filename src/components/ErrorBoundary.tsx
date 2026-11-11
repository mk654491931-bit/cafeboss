import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Uygulamanın herhangi bir yerinde oluşan beklenmedik bir hata tüm sayfayı
 * boş bırakmasın. Kullanıcıya her zaman geri dönüş yolu gösterilir.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    document.getElementById("boot-screen")?.remove();
    console.error("Boss Cafe beklenmeyen hata:", error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="relative flex min-h-screen-safe items-center justify-center overflow-x-hidden bg-espresso-900 px-4 py-12 text-cream-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(192,133,82,0.22),transparent_55%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-cream-100/10 bg-cream-50 p-7 text-espresso-800 shadow-lift sm:p-9">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-espresso-700/10 text-caramel-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-5 font-serif text-2xl">Beklenmeyen bir hata oluştu</h1>
          <p className="mt-2 text-sm leading-relaxed text-espresso-800/65">
            Sayfa güvenli biçimde durduruldu. İnternet bağlantınızı kontrol
            edip sayfayı yenileyin. Sorun devam ederse birkaç dakika sonra
            tekrar deneyin.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={this.reload}
              className="btn btn-primary w-full"
            >
              <RefreshCw className="h-4 w-4" />
              Sayfayı Yenile
            </button>
            <a href="/" className="btn btn-outline w-full">
              <Home className="h-4 w-4" />
              Ana Sayfa
            </a>
          </div>
        </div>
      </div>
    );
  }
}
