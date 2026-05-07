"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const actionSchema = z.object({
  total_score: z.coerce.number().min(0).max(100),
  ai_feedback: z.string().optional(),
});

type ActionInput = z.infer<typeof actionSchema>;

interface AdminSubmissionActionsProps {
  submissionId: string;
  currentStatus: string;
  evaluation?: {
    total_score: number;
    ai_feedback: string | null;
  } | null;
}

export function AdminSubmissionActions({
  submissionId,
  currentStatus,
  evaluation,
}: AdminSubmissionActionsProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const client = supabase;

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReevaluating, setIsReevaluating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActionInput>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      total_score: evaluation?.total_score ?? 0,
      ai_feedback: evaluation?.ai_feedback ?? "",
    },
  });

  const updateEvaluation = async (values: ActionInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan.");
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: upsertError } = await client!.from("evaluations").upsert(
      {
        submission_id: submissionId,
        total_score: values.total_score,
        ai_feedback: values.ai_feedback?.trim() || null,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
        evaluated_by_ai: false,
      },
      { onConflict: "submission_id" },
    );

    if (upsertError) {
      setError(upsertError.message);
      return false;
    }

    return true;
  };

  const onApprove = async (values: ActionInput) => {
    setError(null);
    setNotice(null);

    if (!(await updateEvaluation(values))) {
      return;
    }

    const { error: updateError } = await client!
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", submissionId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Topshiriq tasdiqlandi.");
    router.refresh();
  };

  const onReject = async () => {
    if (!supabase) {
      setError("Supabase sozlanmagan.");
      return;
    }

    setError(null);
    setNotice(null);

    const { error: updateError } = await client!
      .from("submissions")
      .update({ status: "rejected" })
      .eq("id", submissionId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Topshiriq rad etildi.");
    router.refresh();
  };

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/ai-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "AI baholashda xatolik.");
      }

      setNotice("AI baholash qayta ishga tushdi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI baholashda xatolik.");
    } finally {
      setIsReevaluating(false);
    }
  };

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Admin boshqaruvi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onApprove)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Yakuniy ball</label>
            <Input type="number" {...register("total_score")} />
            {errors.total_score && (
              <p className="text-xs text-rose-600">{errors.total_score.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Admin izohi</label>
            <Textarea rows={3} {...register("ai_feedback")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Tasdiqlash
            </Button>
            <Button type="button" variant="outline" onClick={onReject}>
              Rad etish
            </Button>
            <Button type="button" variant="outline" onClick={handleReevaluate} disabled={isReevaluating}>
              {isReevaluating ? "Qayta baholanmoqda..." : "AI qayta baholash"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Joriy status: {currentStatus}</p>
        </form>
      </CardContent>
    </Card>
  );
}
