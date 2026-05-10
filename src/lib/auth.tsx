import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureCurrentUserRecord } from "@/lib/account.functions";

type Role = "admin" | "farmer" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, role: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const ensureUserRecord = useServerFn(ensureCurrentUserRecord);

  useEffect(() => {
    const fetchRole = async (uid: string | undefined) => {
      if (!uid) { setRole(null); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
      if (data?.role) { setRole(data.role as Role); return; }
      try {
        const synced = await ensureUserRecord();
        setRole((synced.role as Role) ?? "farmer");
      } catch {
        setRole("farmer");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => fetchRole(s?.user?.id), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await fetchRole(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [ensureUserRecord]);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      role,
      loading,
      signOut: async () => { await supabase.auth.signOut(); setRole(null); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
