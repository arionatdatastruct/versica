import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const onboardedAt = meta.onboarded_at;
    const isOnWelcome = location.pathname === "/app/willkommen";
    if (!onboardedAt && !isOnWelcome) {
      navigate({ to: "/app/willkommen", replace: true });
    } else if (onboardedAt && isOnWelcome) {
      navigate({ to: "/app/dashboard", replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return <Outlet />;
}
