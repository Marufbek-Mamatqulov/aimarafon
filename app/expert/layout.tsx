import { ExpertShell } from "@/components/layout/expert-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ExpertLayout({
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

  return <ExpertShell userLabel={userLabel}>{children}</ExpertShell>;
}
