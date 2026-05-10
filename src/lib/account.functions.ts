import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ensureCurrentUserRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) throw new Error(userError?.message ?? "User not found");

    const email = (userData.user.email ?? "").trim().toLowerCase();
    const meta = userData.user.user_metadata ?? {};
    const role = email === "admin@gmail.com" ? "admin" : "farmer";

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: role === "admin" ? "Officer Admin" : String(meta.full_name ?? "Farmer"),
      phone: String(meta.phone ?? ""),
      village: role === "admin" ? null : (meta.village ? String(meta.village) : null),
      district: role === "admin" ? null : (meta.district ? String(meta.district) : null),
      state: role === "admin" ? null : (meta.state ? String(meta.state) : null),
    });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    if (roleError) throw new Error(roleError.message);

    return { role };
  });