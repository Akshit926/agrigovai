import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: () => {
    const { user, role, loading } = useAuth();
    if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
    if (!user) return <Navigate to="/login" />;
    return <Navigate to={role === "farmer" ? "/farmer" : "/dashboard"} />;
  },
});
