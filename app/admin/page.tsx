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

export default async function AdminDashboardPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Admin analytics mavjud emas.
        </CardContent>
      </Card>
    );
  }

  const [participantsResult, submissionsResult, pendingResult, approvedResult, leaderboardResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "participant"),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("leaderboard_view")
        .select("participant_id, participant_code, full_name, total_score, rank")
        .order("rank")
        .limit(5),
    ]);

  const { data: recentSubmissions } = await supabase
    .from("submissions")
    .select(
      "id, status, submitted_at, participant:profiles(full_name, participant_code), task:tasks(day_number, title), evaluation:evaluations(total_score)",
    )
    .order("submitted_at", { ascending: false })
    .limit(6);

  const { data: evaluationRows } = await supabase
    .from("evaluations")
    .select("total_score")
    .limit(200);

  const averageScore = evaluationRows && evaluationRows.length > 0
    ? Math.round(
        evaluationRows.reduce((sum, row) => sum + Number(row.total_score ?? 0), 0) /
          evaluationRows.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ishtirokchilar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {participantsResult.count ?? 0}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Yuborilgan ishlar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {submissionsResult.count ?? 0}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Kutilayotgan baholash</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {pendingResult.count ?? 0}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Tasdiqlangan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {approvedResult.count ?? 0}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ortacha ball</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {averageScore}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Top ishtirokchilar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orin</TableHead>
                  <TableHead>Ishtirokchi</TableHead>
                  <TableHead className="text-right">Ball</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leaderboardResult.data ?? []).map((row) => (
                  <TableRow key={row.participant_id}>
                    <TableCell>{row.rank}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{row.full_name}</p>
                        <p className="text-xs text-slate-500">{row.participant_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{row.total_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">So nggi yuborilganlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ishtirokchi</TableHead>
                  <TableHead>Topshiriq</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ball</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentSubmissions ?? []).map((submission) => {
                  const participant = Array.isArray(submission.participant)
                    ? submission.participant[0]
                    : submission.participant;
                  const task = Array.isArray(submission.task) ? submission.task[0] : submission.task;
                  const evaluation = Array.isArray(submission.evaluation)
                    ? submission.evaluation[0]
                    : submission.evaluation;
                  const score = evaluation?.total_score ?? null;

                  return (
                    <TableRow key={submission.id}>
                      <TableCell>{participant?.full_name ?? "--"}</TableCell>
                      <TableCell>
                        Day {task?.day_number ?? "--"} - {task?.title ?? ""}
                      </TableCell>
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
      </section>
    </div>
  );
}
