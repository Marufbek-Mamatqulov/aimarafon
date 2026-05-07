import { notFound } from "next/navigation";

import { TaskForm } from "@/components/admin/task-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: task } = await supabase
    .from("tasks")
    .select(
      "id, marathon_id, day_number, title, description, instruction, expected_output, deadline, max_score, is_published",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!task) {
    notFound();
  }

  return <TaskForm marathonId={task.marathon_id} task={task} />;
}
