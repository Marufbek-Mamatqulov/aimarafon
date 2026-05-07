import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();
  let userLabel: string | null = null;
  let roleLabel: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      userLabel = profile?.full_name || user.email || null;
      roleLabel = profile?.role ? profile.role.toUpperCase() : null;
    }
  }

  return (
    <DashboardShell userLabel={userLabel} roleLabel={roleLabel}>
      {children}
    </DashboardShell>
  );
}
