import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  submitted: "Topshirildi",
  ai_evaluated: "Baholandi",
  expert_reviewed: "Ekspert ko'rdi",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
};

export default async function TasksPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Topshiriqlar demo rejimida mavjud emas.
        </CardContent>
      </Card>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Foydalanuvchi topilmadi.</CardContent>
      </Card>
    );
  }

  const { data: marathon } = await supabase
    .from("marathons")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const [{ data: tasks }, { data: submissions }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, day_number, title, description, deadline")
      .eq("marathon_id", marathon?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("is_published", true)
      .order("day_number"),
    supabase
      .from("submissions")
      .select("task_id, status, submitted_at")
      .eq("participant_id", user.id),
  ]);

  const submissionMap = new Map(
    (submissions ?? []).map((item) => [item.task_id, item]),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(tasks ?? []).map((task) => {
        const submission = submissionMap.get(task.id);
        const status = submission?.status ?? "not_started";
        const label = statusLabels[status] || "Boshlanmagan";

        return (
          <Card key={task.id} className="border-slate-200/70">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <Badge className="mb-2 bg-slate-900 text-white">Day {task.day_number}</Badge>
                <CardTitle className="text-base text-slate-900">{task.title}</CardTitle>
              </div>
              <Badge className="bg-blue-50 text-blue-700">{label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{task.description}</p>
              <p>Deadline: {task.deadline ? new Date(task.deadline).toLocaleString("uz-UZ") : "--"}</p>
              <Link href={`/dashboard/tasks/${task.id}`} className="text-indigo-600 hover:underline">
                Topshiriqni ochish
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
