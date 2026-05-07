import { notFound } from "next/navigation";

import { AdminSubmissionActions } from "@/components/admin/submission-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
      </Card>
    );
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select(
      "id, status, submitted_at, prompt_text, ai_result, result_url, file_url, participant_comment, participant:profiles(full_name, participant_code, email, phone, region, organization), task:tasks(day_number, title, description, instruction, expected_output, deadline)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!submission) {
    notFound();
  }

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select(
      "total_score, relevance_score, prompt_quality_score, ai_usage_score, practical_value_score, creativity_score, analysis_score, punctuality_score, ai_feedback",
    )
    .eq("submission_id", submission.id)
    .maybeSingle();

  const { data: expertReviews } = await supabase
    .from("expert_reviews")
    .select("score, comment, expert:profiles(full_name)")
    .eq("submission_id", submission.id)
    .order("created_at", { ascending: false });

  const participant = Array.isArray(submission.participant)
    ? submission.participant[0]
    : submission.participant;

  const task = Array.isArray(submission.task) ? submission.task[0] : submission.task;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/70">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-900 text-white">Day {task?.day_number ?? "--"}</Badge>
            <Badge className="bg-blue-50 text-blue-700">{submission.status}</Badge>
          </div>
          <CardTitle className="text-lg text-slate-900">{task?.title ?? "Topshiriq"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ishtirokchi</p>
              <p className="text-base font-semibold text-slate-900">{participant?.full_name ?? "--"}</p>
              <p>{participant?.participant_code ?? "--"}</p>
              <p>{participant?.email ?? "--"}</p>
              <p>{participant?.phone ?? "--"}</p>
              <p>{participant?.region ?? "--"}</p>
              <p>{participant?.organization ?? "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Topshiriq</p>
              <p>{task?.description ?? "--"}</p>
              <p className="mt-2">Deadline: {task?.deadline ? new Date(task.deadline).toLocaleString("uz-UZ") : "--"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Prompt</p>
            <p className="whitespace-pre-line">{submission.prompt_text}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">AI natijasi</p>
            <p className="whitespace-pre-line">{submission.ai_result || "--"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Natija havolasi</p>
            <p>{submission.result_url || "--"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Izoh</p>
            <p>{submission.participant_comment || "--"}</p>
          </div>
        </CardContent>
      </Card>

      {evaluation && (
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">AI baholash</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>Topshiriq mosligi: {evaluation.relevance_score}</div>
            <div>Prompt sifati: {evaluation.prompt_quality_score}</div>
            <div>AI vositasi: {evaluation.ai_usage_score}</div>
            <div>Amaliy qiymat: {evaluation.practical_value_score}</div>
            <div>Kreativlik: {evaluation.creativity_score}</div>
            <div>Tahlil: {evaluation.analysis_score}</div>
            <div>Punktuallik: {evaluation.punctuality_score}</div>
            <div className="font-semibold text-slate-900">Umumiy ball: {evaluation.total_score}</div>
            <div className="sm:col-span-2">{evaluation.ai_feedback}</div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Ekspert fikrlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {(expertReviews ?? []).length === 0 ? (
            <p>Ekspert fikrlari mavjud emas.</p>
          ) : (
            expertReviews?.map((review, index) => {
              const expert = Array.isArray(review.expert) ? review.expert[0] : review.expert;
              return (
                <div key={`${review.score}-${index}`} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{expert?.full_name ?? "Ekspert"}</p>
                  <p>Ball: {review.score ?? "--"}</p>
                  <p>{review.comment || "--"}</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AdminSubmissionActions
        submissionId={submission.id}
        currentStatus={submission.status}
        evaluation={evaluation ?? null}
      />
    </div>
  );
}
