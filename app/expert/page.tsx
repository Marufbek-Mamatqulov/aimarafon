import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ExpertDashboardPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const [{ count: pendingCount }, { count: reviewedCount }] = await Promise.all([
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ai_evaluated"),
    supabase
      .from("expert_reviews")
      .select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Kutilayotgan review</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-900">
          {pendingCount ?? 0}
        </CardContent>
      </Card>
      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Ekspert sharhlari</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-900">
          {reviewedCount ?? 0}
        </CardContent>
      </Card>
    </div>
  );
}
