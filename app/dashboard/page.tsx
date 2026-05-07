import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value: string | null) {
  if (!value) {
    return "---";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "---";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function DashboardHomePage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Demo rejimda profil va natijalar korinmaydi.
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

  const [profileResult, leaderboardResult, submissionsResult, marathonResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, participant_code")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("leaderboard_view")
        .select("total_score, rank")
        .eq("participant_id", user.id)
        .maybeSingle(),
      supabase
        .from("submissions")
        .select("id, task_id, status, submitted_at")
        .eq("participant_id", user.id)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("marathons")
        .select("id, start_date")
        .eq("status", "active")
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;
  const leaderboard = leaderboardResult.data;
  const submissions = submissionsResult.data ?? [];
  const marathon = marathonResult.data;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, day_number, deadline")
    .eq("marathon_id", marathon?.id ?? "00000000-0000-0000-0000-000000000000")
    .eq("is_published", true)
    .order("day_number");

  const submittedTaskIds = new Set(submissions.map((item) => item.task_id));
  const completedCount = submissions.filter((item) =>
    ["ai_evaluated", "expert_reviewed", "approved"].includes(item.status),
  ).length;

  const startDate = marathon?.start_date ? new Date(marathon.start_date) : null;
  let todayTask = null;

  if (startDate && tasks) {
    const diffDays = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dayNumber = Math.max(1, diffDays + 1);
    todayTask = tasks.find((task) => task.day_number === dayNumber) ?? null;
  }

  const nextTask =
    tasks?.find((task) => !submittedTaskIds.has(task.id)) ?? todayTask ?? tasks?.[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ishtirokchi kodi</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-slate-900">
            {profile?.participant_code || "---"}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Umumiy ball</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-slate-900">
            {leaderboard?.total_score ?? 0}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Joriy orin</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-slate-900">
            {leaderboard?.rank ?? "---"}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Yakunlangan topshiriqlar</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-slate-900">
            {completedCount}
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">Bugungi vazifa</CardTitle>
            <p className="text-sm text-slate-600">Marafon jadvali asosida</p>
          </div>
          {nextTask && <Badge className="bg-indigo-50 text-indigo-700">Day {nextTask.day_number}</Badge>}
        </CardHeader>
        <CardContent className="space-y-2">
          {nextTask ? (
            <>
              <p className="text-base font-semibold text-slate-900">{nextTask.title}</p>
              <p className="text-sm text-slate-600">Deadline: {formatDate(nextTask.deadline)}</p>
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                <Link href={`/dashboard/tasks/${nextTask.id}`}>Topshiriqni ochish</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-600">Topshiriqlar mavjud emas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
