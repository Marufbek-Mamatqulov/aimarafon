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

export default async function AdminLeaderboardPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: leaderboard } = await supabase
    .from("leaderboard_view")
    .select(
      "participant_id, participant_code, full_name, region, organization, total_score, completed_tasks_count, rank",
    )
    .order("rank")
    .limit(100);

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Reyting boshqaruvi</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orin</TableHead>
              <TableHead>Ishtirokchi</TableHead>
              <TableHead>Hudud</TableHead>
              <TableHead>Tashkilot</TableHead>
              <TableHead className="text-right">Ball</TableHead>
              <TableHead className="text-right">Yakunlangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(leaderboard ?? []).map((row) => (
              <TableRow key={row.participant_id}>
                <TableCell>{row.rank}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.participant_code}</p>
                  </div>
                </TableCell>
                <TableCell>{row.region || "--"}</TableCell>
                <TableCell>{row.organization || "--"}</TableCell>
                <TableCell className="text-right font-semibold">{row.total_score}</TableCell>
                <TableCell className="text-right">{row.completed_tasks_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
