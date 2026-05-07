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

export default async function EvaluationsPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(
      "id, total_score, evaluated_by_ai, created_at, submission:submissions(id, participant:profiles(full_name, participant_code))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Baholash natijalari</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ishtirokchi</TableHead>
              <TableHead className="text-right">Ball</TableHead>
              <TableHead>AI</TableHead>
              <TableHead>Vaqt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(evaluations ?? []).map((evaluation) => {
              const submission = Array.isArray(evaluation.submission)
                ? evaluation.submission[0]
                : evaluation.submission;
              const participant = Array.isArray(submission?.participant)
                ? submission?.participant[0]
                : submission?.participant;
              return (
                <TableRow key={evaluation.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{participant?.full_name ?? "--"}</p>
                      <p className="text-xs text-slate-500">{participant?.participant_code ?? "--"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{evaluation.total_score}</TableCell>
                  <TableCell>{evaluation.evaluated_by_ai ? "AI" : "Manual"}</TableCell>
                  <TableCell>
                    {evaluation.created_at
                      ? new Date(evaluation.created_at).toLocaleString("uz-UZ")
                      : "--"}
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
