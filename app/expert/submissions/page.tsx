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

export default async function ExpertSubmissionsPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, status, submitted_at, participant:profiles(full_name, participant_code), task:tasks(day_number, title), evaluation:evaluations(total_score)",
    )
    .in("status", ["ai_evaluated", "submitted"])
    .order("submitted_at", { ascending: false })
    .limit(50);

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Ekspert ko rib chiqishi</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ishtirokchi</TableHead>
              <TableHead>Topshiriq</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ball</TableHead>
              <TableHead>Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(submissions ?? []).map((submission) => {
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
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{participant?.full_name ?? "--"}</p>
                      <p className="text-xs text-slate-500">{participant?.participant_code ?? "--"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    Day {task?.day_number ?? "--"} - {task?.title ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700">{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{score ?? "--"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/expert/reviews?submissionId=${submission.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Sharh berish
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
