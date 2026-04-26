import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-xl border border-border bg-card p-10">
            <h1 className="text-xl font-bold text-foreground">Officer access only</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This dashboard is restricted to authorised agriculture officers. If you should have access,
              contact your district administrator.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
