import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!role) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (role !== "admin") return <Navigate to="/farmer" />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
