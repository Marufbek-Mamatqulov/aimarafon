import { notFound } from "next/navigation";

import { ReviewForm } from "@/components/expert/review-form";
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

export default async function ExpertReviewsPage({
  searchParams,
}: {
  searchParams: { submissionId?: string };
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <Card className="border-slate-200/70">
        <CardContent className="p-6 text-slate-600">Supabase sozlanmagan.</CardContent>
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

  const submissionId = searchParams.submissionId;

  if (submissionId) {
    const { data: submission } = await supabase
      .from("submissions")
      .select(
        "id, status, prompt_text, ai_result, result_url, participant_comment, participant:profiles(full_name, participant_code), task:tasks(day_number, title)",
      )
      .eq("id", submissionId)
      .maybeSingle();

    if (!submission) {
      notFound();
    }

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
            <CardTitle className="text-base text-slate-900">{task?.title ?? "Topshiriq"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{participant?.full_name ?? "--"}</p>
            <p className="text-xs text-slate-500">{participant?.participant_code ?? "--"}</p>
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

        <ReviewForm submissionId={submission.id} />
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from("expert_reviews")
    .select(
      "id, score, comment, submission:submissions(id, task:tasks(day_number, title), participant:profiles(full_name, participant_code))",
    )
    .eq("expert_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Mening sharhlarim</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ishtirokchi</TableHead>
              <TableHead>Topshiriq</TableHead>
              <TableHead>Ball</TableHead>
              <TableHead>Izoh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reviews ?? []).map((review) => {
              const submission = Array.isArray(review.submission)
                ? review.submission[0]
                : review.submission;
              const participant = Array.isArray(submission?.participant)
                ? submission?.participant[0]
                : submission?.participant;
              const task = Array.isArray(submission?.task) ? submission?.task[0] : submission?.task;

              return (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{participant?.full_name ?? "--"}</p>
                      <p className="text-xs text-slate-500">{participant?.participant_code ?? "--"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    Day {task?.day_number ?? "--"} - {task?.title ?? ""}
                  </TableCell>
                  <TableCell>{review.score ?? "--"}</TableCell>
                  <TableCell>{review.comment ?? "--"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
