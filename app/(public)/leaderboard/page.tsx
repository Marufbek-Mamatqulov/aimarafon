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

type LeaderboardRow = {
  participant_id: string;
  participant_code: string | null;
  full_name: string;
  region: string | null;
  organization: string | null;
  total_score: number;
  completed_tasks_count: number;
  rank: number;
};

const demoRows: LeaderboardRow[] = [
  {
    participant_id: "demo-1",
    participant_code: "AI-2026-000001",
    full_name: "Nodira Karimova",
    region: "Samarqand",
    organization: "Samarqand pedagogika",
    total_score: 612,
    completed_tasks_count: 7,
    rank: 1,
  },
  {
    participant_id: "demo-2",
    participant_code: "AI-2026-000014",
    full_name: "Sherzod Rahimov",
    region: "Toshkent shahri",
    organization: "Toshkent shahar maktabi",
    total_score: 588,
    completed_tasks_count: 7,
    rank: 2,
  },
  {
    participant_id: "demo-3",
    participant_code: "AI-2026-000023",
    full_name: "Dilorom Akramova",
    region: "Fargona",
    organization: "Fargona akademik litseyi",
    total_score: 540,
    completed_tasks_count: 6,
    rank: 3,
  },
];

function maskName(fullName: string) {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) {
    return `${parts[0].slice(0, 2)}***`;
  }

  const [first, last] = parts;
  return `${first} ${last.charAt(0)}.`;
}

export default async function LeaderboardPage() {
  const supabase = getSupabaseServerClient();
  let rows = demoRows;
  let mode: "demo" | "live" = "demo";

  if (supabase) {
    const { data } = await supabase
      .from("leaderboard_view")
      .select(
        "participant_id, participant_code, full_name, region, organization, total_score, completed_tasks_count, rank",
      )
      .order("rank")
      .limit(50);

    if (data && data.length > 0) {
      rows = data as LeaderboardRow[];
      mode = "live";
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-slate-200/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900">Reyting jadvali</CardTitle>
              <p className="text-sm text-slate-600">
                Natijalar AI va ekspert baholashlariga asoslangan.
              </p>
            </div>
            <Badge className={mode === "live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
              {mode === "live" ? "Jonli" : "Demo"}
            </Badge>
          </div>
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
              {rows.map((row) => (
                <TableRow key={row.participant_id}>
                  <TableCell className="font-semibold">{row.rank}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{maskName(row.full_name)}</p>
                      <p className="text-xs text-slate-500">{row.participant_code || "--"}</p>
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
    </div>
  );
}
