import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import SitePage from "./pages/SitePage";
import TableMenuPage from "./pages/TableMenuPage";
import AdminPage from "./pages/AdminPage";
import ScrollProgress from "./components/ScrollProgress";
import BackToTop from "./components/BackToTop";
import { ToastProvider } from "./components/Toast";

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    if (!hash) window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollManager />
        <ScrollProgress />
        <BackToTop />
        <Routes>
          <Route path="/" element={<SitePage />} />
          <Route path="/masa/:tableNo" element={<TableMenuPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
