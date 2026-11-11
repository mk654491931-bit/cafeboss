import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import SitePage from "./pages/SitePage";
import ScrollProgress from "./components/ScrollProgress";
import BackToTop from "./components/BackToTop";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";

// Admin paneli ana sayfayı ziyaret eden herkesin indirdiği pakete girmesin.
const AdminPage = lazy(() => import("./pages/AdminPage"));

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // Bozuk yüzde kodlaması sayfayı düşürmesin; ham kimlikle devam et.
      }
      const target = id ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    if (!hash) window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}

function BootCleanup() {
  useEffect(() => {
    document.getElementById("boot-screen")?.remove();
  }, []);
  return null;
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen-safe items-center justify-center bg-cream-100 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src="/logo.svg" alt="Boss Cafe" className="h-16 w-auto" />
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-espresso-700/15 border-t-caramel-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-espresso-700/70">
          Yönetim paneli hazırlanıyor…
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <BootCleanup />
      <ErrorBoundary>
        <ToastProvider>
          <BrowserRouter>
            <ScrollManager />
            <ScrollProgress />
            <BackToTop />
            <Routes>
              <Route path="/" element={<SitePage />} />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<RouteLoading />}>
                    <AdminPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ErrorBoundary>
    </>
  );
}
