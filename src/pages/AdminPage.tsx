import { Loader2 } from "lucide-react";
import AdminLogin from "../components/admin/AdminLogin";
import Dashboard from "../components/admin/Dashboard";
import { useSession } from "../hooks/useSession";

export default function AdminPage() {
  const { session, loading, preview, error } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center bg-espresso-900">
        <Loader2 className="h-8 w-8 animate-spin text-caramel-400" />
        <span className="sr-only">Oturum kontrol ediliyor</span>
      </div>
    );
  }

  return session || preview ? <Dashboard /> : <AdminLogin notice={error} />;
}
