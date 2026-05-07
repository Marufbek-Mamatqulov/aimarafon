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

export default async function ParticipantsPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const [{ data: profiles }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, email, region, organization, participant_code, is_blocked")
      .eq("role", "participant")
      .order("created_at", { ascending: true }),
    supabase
      .from("leaderboard_view")
      .select("participant_id, total_score, completed_tasks_count, rank"),
  ]);

  const leaderboardMap = new Map(
    (leaderboard ?? []).map((row) => [row.participant_id, row]),
  );

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Ishtirokchilar</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Hudud</TableHead>
              <TableHead>Tashkilot</TableHead>
              <TableHead className="text-right">Ball</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiles ?? []).map((profile) => {
              const stats = leaderboardMap.get(profile.id) as
                | { total_score: number; completed_tasks_count: number; rank: number }
                | undefined;
              return (
                <TableRow key={profile.id}>
                  <TableCell>{profile.participant_code || "--"}</TableCell>
                  <TableCell>{profile.full_name}</TableCell>
                  <TableCell>{profile.phone || "--"}</TableCell>
                  <TableCell>{profile.email || "--"}</TableCell>
                  <TableCell>{profile.region || "--"}</TableCell>
                  <TableCell>{profile.organization || "--"}</TableCell>
                  <TableCell className="text-right font-semibold">{stats?.total_score ?? 0}</TableCell>
                  <TableCell>
                    <Badge className={profile.is_blocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}>
                      {profile.is_blocked ? "Bloklangan" : "Faol"}
                    </Badge>
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
