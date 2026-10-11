import { Loader2 } from "lucide-react";
import AdminLogin from "../components/admin/AdminLogin";
import Dashboard from "../components/admin/Dashboard";
import { useSession } from "../hooks/useSession";

export default function AdminPage() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-espresso-900">
        <Loader2 className="h-8 w-8 animate-spin text-caramel-400" />
        <span className="sr-only">Oturum kontrol ediliyor</span>
      </div>
    );
  }

  return session ? <Dashboard /> : <AdminLogin />;
}
