import { TaskForm } from "@/components/admin/task-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewTaskPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: marathon } = await supabase
    .from("marathons")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!marathon) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Faol marafon topilmadi.</CardContent>
      </Card>
    );
  }

  return <TaskForm marathonId={marathon.id} />;
}
