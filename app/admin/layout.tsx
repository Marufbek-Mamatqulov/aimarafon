import { AdminShell } from "@/components/layout/admin-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();
  let userLabel: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userLabel = user.email ?? null;
    }
  }

  return <AdminShell userLabel={userLabel}>{children}</AdminShell>;
}
