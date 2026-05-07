import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  submitted: "Topshirildi",
  ai_evaluated: "Baholandi",
  expert_reviewed: "Ekspert ko'rdi",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
};

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

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">
          Supabase sozlanmagan. Topshiriq ma lumotlari mavjud emas.
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

  const { data: task } = await supabase
    .from("tasks")
    .select("id, day_number, title, description, instruction, expected_output, deadline")
    .eq("id", params.id)
    .maybeSingle();

  if (!task) {
    notFound();
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select(
      "id, prompt_text, ai_result, result_url, file_url, participant_comment, status, submitted_at, is_late",
    )
    .eq("task_id", task.id)
    .eq("participant_id", user.id)
    .maybeSingle();

  const { data: evaluation } = submission
    ? await supabase
        .from("evaluations")
        .select(
          "total_score, relevance_score, prompt_quality_score, ai_usage_score, practical_value_score, creativity_score, analysis_score, punctuality_score, ai_feedback",
        )
        .eq("submission_id", submission.id)
        .maybeSingle()
    : { data: null };

  const bucketName = process.env.NEXT_PUBLIC_SUBMISSION_BUCKET || "submission-files";
  const submissionStatus = submission?.status ?? "not_started";

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/70">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-900 text-white">Day {task.day_number}</Badge>
            <Badge className="bg-blue-50 text-blue-700">
              {statusLabels[submissionStatus] || "Boshlanmagan"}
            </Badge>
            {submission?.is_late && <Badge className="bg-rose-50 text-rose-700">Kechikkan</Badge>}
          </div>
          <CardTitle className="text-lg text-slate-900">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>{task.description}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Korsatma
            </p>
            <p className="mt-1 whitespace-pre-line">{task.instruction || "--"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Kutilgan natija
            </p>
            <p className="mt-1 whitespace-pre-line">{task.expected_output || "--"}</p>
          </div>
          <p>Deadline: {formatDate(task.deadline)}</p>
        </CardContent>
      </Card>

      <SubmissionForm
        taskId={task.id}
        deadline={task.deadline}
        existingSubmission={submission ?? null}
        bucketName={bucketName}
      />

      {evaluation && (
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">AI baholash natijasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>Topshiriq mosligi: {evaluation.relevance_score}</div>
              <div>Prompt sifati: {evaluation.prompt_quality_score}</div>
              <div>AI vositasi: {evaluation.ai_usage_score}</div>
              <div>Amaliy qiymat: {evaluation.practical_value_score}</div>
              <div>Kreativlik: {evaluation.creativity_score}</div>
              <div>Tahlil: {evaluation.analysis_score}</div>
              <div>Punktuallik: {evaluation.punctuality_score}</div>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Umumiy ball: {evaluation.total_score}</p>
              <p className="mt-2">{evaluation.ai_feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
