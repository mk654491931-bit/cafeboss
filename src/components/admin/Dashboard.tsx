import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Coffee,
  ExternalLink,
  Images,
  Loader2,
  LogOut,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import ProductRow from "./ProductRow";
import AddProductModal from "./AddProductModal";
import ConfirmDialog from "./ConfirmDialog";
import GalleryEditor from "./GalleryEditor";
import { useToast } from "../Toast";
import { useMenu } from "../../hooks/useMenu";
import { signOut } from "../../lib/auth";
import type { Product } from "../../lib/types";

type View = "products" | "gallery";

export default function Dashboard() {
  const toast = useToast();
  const {
    products,
    loading,
    error,
    reload,
    addProduct,
    changePrice,
    changeCategory,
    changeImage,
    changeAvailability,
    removeProduct,
  } = useMenu();

  const [view, setView] = useState<View>("products");
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const stats = useMemo(() => {
    const available = products.filter((product) => product.is_available).length;
    return {
      total: products.length,
      available,
      soldOut: products.length - available,
    };
  }, [products]);

  async function handleLogout() {
    setLoggingOut(true);
    const message = await signOut();
    setLoggingOut(false);
    if (message) toast.error(message);
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-espresso-700/10 bg-cream-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-espresso-700 text-caramel-400">
              <Coffee className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-serif text-lg leading-tight text-espresso-800">
                Menü Yönetimi
              </h1>
              <p className="text-xs text-espresso-800/55">Boss Cafe Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="btn btn-outline btn-sm">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Siteyi Gör</span>
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="btn btn-sm bg-espresso-700 text-cream-100 hover:bg-espresso-800"
            >
              {loggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Toplam Ürün", value: stats.total, icon: ShoppingBag },
            { label: "Menüde Aktif", value: stats.available, icon: PackageCheck },
            { label: "Tükendi", value: stats.soldOut, icon: UtensilsCrossed },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-espresso-700/8 text-caramel-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-2xl text-espresso-800">{value}</p>
                <p className="text-xs uppercase tracking-wider text-espresso-800/55">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          role="tablist"
          aria-label="Yönetim bölümleri"
          className="mt-8 flex w-fit gap-1 rounded-full border border-espresso-700/15 bg-white/70 p-1"
        >
          {(
            [
              { id: "products", label: "Ürünler", icon: ShoppingBag },
              { id: "gallery", label: "Galeri", icon: Images },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setView(id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                  isActive
                    ? "bg-espresso-700 text-cream-100 shadow-soft"
                    : "text-espresso-700 hover:bg-espresso-700/8"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {view === "gallery" ? (
          <GalleryEditor />
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-espresso-800">Ürünler</h2>
                <p className="text-sm text-espresso-800/60">
                  Kategoriyi seçerek, fiyata tıklayarak ve anahtarla durumu
                  değiştirin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="h-4 w-4" />
                Yeni Ürün Ekle
              </button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-espresso-500/30 bg-white/70 p-5 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-caramel-600" />
                <p className="mt-2 text-sm font-medium text-espresso-800">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="btn btn-outline btn-sm mt-4"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Yükle
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-6 space-y-3" aria-label="Ürünler yükleniyor">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="card h-20 animate-pulse bg-white/50"
                  />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="mt-6">
                <div className="hidden gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-espresso-800/50 md:grid md:grid-cols-[minmax(0,2.4fr)_auto_auto_auto]">
                  <span>Ürün</span>
                  <span className="justify-self-start">Fiyat</span>
                  <span className="justify-self-start">Durum</span>
                  <span className="justify-self-end">İşlem</span>
                </div>

                {products.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Coffee className="mx-auto h-8 w-8 text-espresso-500/70" />
                    <p className="mt-3 font-serif text-lg text-espresso-800">
                      Henüz ürün eklenmedi
                    </p>
                    <p className="mt-1 text-sm text-espresso-800/60">
                      İlk ürünü ekleyerek menüyü oluşturmaya başlayın.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAdd(true)}
                      className="btn btn-primary btn-sm mt-5"
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Ürün Ekle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onPrice={changePrice}
                        onCategory={changeCategory}
                        onImage={changeImage}
                        onAvailability={changeAvailability}
                        onDelete={setPendingDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSubmit={async (input) => {
            const message = await addProduct(input);
            if (message) return message;
            toast.success(`${input.name} menüye eklendi.`);
            return null;
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Ürün silinsin mi?"
          message={`"${pendingDelete.name}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            const message = await removeProduct(pendingDelete.id);
            if (message) return message;
            toast.success(`${pendingDelete.name} silindi.`);
            return null;
          }}
        />
      )}
    </div>
  );
}
