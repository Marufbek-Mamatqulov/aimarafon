import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  submitted: "Topshirildi",
  ai_evaluated: "Baholandi",
  expert_reviewed: "Ekspert ko'rdi",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
};

export default async function SubmissionsPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Yuborilganlar korinmaydi.
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

  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, status, submitted_at, task:tasks(id, title, day_number), evaluation:evaluations(total_score)",
    )
    .eq("participant_id", user.id)
    .order("submitted_at", { ascending: false });

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Yuborilgan ishlar</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kun</TableHead>
              <TableHead>Topshiriq</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ball</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(submissions ?? []).map((submission) => {
              const task = Array.isArray(submission.task) ? submission.task[0] : submission.task;
              const evaluation = Array.isArray(submission.evaluation)
                ? submission.evaluation[0]
                : submission.evaluation;
              const score = evaluation?.total_score ?? null;
              const status = statusLabels[submission.status] || submission.status;

              return (
                <TableRow key={submission.id}>
                  <TableCell>Day {task?.day_number ?? "--"}</TableCell>
                  <TableCell>
                    {task ? (
                      <Link href={`/dashboard/tasks/${task.id}`} className="text-indigo-600 hover:underline">
                        {task.title}
                      </Link>
                    ) : (
                      "--"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700">{status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{score ?? "--"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
