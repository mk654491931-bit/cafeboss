import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
const bootScreen = document.getElementById("boot-screen");

function showBootError(): void {
  const status = document.getElementById("boot-status");
  if (status) {
    status.textContent =
      "Site yüklenemedi. İnternetinizi kontrol edip sayfayı yenileyin.";
  }
  bootScreen?.classList.add("is-slow");
}

if (!container) {
  showBootError();
  throw new Error("Root container bulunamadı.");
}

try {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  showBootError();
  throw error;
}

// Yalnızca üretimde: Site bir kez açıldıktan sonra ağ kesintilerinde de
// açılabilsin. Geliştirme sunucusunda eski dosyaların takılmasını önler.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
