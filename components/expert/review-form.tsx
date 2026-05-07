"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";

interface ReviewFormProps {
  submissionId: string;
}

export function ReviewForm({ submissionId }: ReviewFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema) });

  const onSubmit = async (values: ReviewInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan.");
      return;
    }

    setError(null);
    setNotice(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessiya topilmadi.");
      return;
    }

    const { error: insertError } = await supabase.from("expert_reviews").upsert(
      {
        submission_id: submissionId,
        expert_id: user.id,
        score: values.score,
        comment: values.comment,
      },
      { onConflict: "submission_id,expert_id" },
    );

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await supabase.from("submissions").update({ status: "expert_reviewed" }).eq("id", submissionId);

    setNotice("Ekspert sharhi saqlandi.");
    router.refresh();
  };

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Ekspert sharhi</CardTitle>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Ball</label>
            <Input type="number" {...register("score")} />
            {errors.score && <p className="text-xs text-rose-600">{errors.score.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Izoh</label>
            <Textarea rows={3} {...register("comment")} />
            {errors.comment && <p className="text-xs text-rose-600">{errors.comment.message}</p>}
          </div>
          <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda..." : "Sharh yuborish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
