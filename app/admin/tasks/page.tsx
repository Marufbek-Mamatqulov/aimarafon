import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default async function AdminTasksPage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: marathon } = await supabase
    .from("marathons")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, day_number, title, deadline, is_published")
    .eq("marathon_id", marathon?.id ?? "00000000-0000-0000-0000-000000000000")
    .order("day_number");

  return (
    <Card className="border-slate-200/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-slate-900">Topshiriqlar</CardTitle>
        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
          <Link href="/admin/tasks/new">Yangi topshiriq</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kun</TableHead>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tasks ?? []).map((task) => (
              <TableRow key={task.id}>
                <TableCell>Day {task.day_number}</TableCell>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.deadline ? new Date(task.deadline).toLocaleString("uz-UZ") : "--"}</TableCell>
                <TableCell>
                  <Badge className={task.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                    {task.is_published ? "E'lon qilingan" : "Qoralama"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/tasks/${task.id}/edit`} className="text-indigo-600 hover:underline">
                    Tahrirlash
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
