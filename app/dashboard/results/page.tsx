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

export default async function ResultsPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Natijalar korinmaydi.
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
      "id, status, submitted_at, task:tasks(day_number, title), evaluation:evaluations(total_score, ai_feedback)",
    )
    .eq("participant_id", user.id)
    .order("submitted_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Kunlik natijalar</CardTitle>
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

                return (
                  <TableRow key={submission.id}>
                    <TableCell>Day {task?.day_number ?? "--"}</TableCell>
                    <TableCell>{task?.title ?? "--"}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700">{submission.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{score ?? "--"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(submissions ?? []).map((submission) => {
        const task = Array.isArray(submission.task) ? submission.task[0] : submission.task;
        const evaluation = Array.isArray(submission.evaluation)
          ? submission.evaluation[0]
          : submission.evaluation;
        const feedback = evaluation?.ai_feedback ?? null;

        if (!feedback) {
          return null;
        }

        return (
          <Card key={`${submission.id}-feedback`} className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">
                Day {task?.day_number ?? "--"}: {task?.title ?? "Topshiriq"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">{feedback}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
