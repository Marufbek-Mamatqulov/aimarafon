"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { submissionSchema, type SubmissionInput } from "@/lib/validations/submission";

interface SubmissionFormProps {
  taskId: string;
  deadline: string | null;
  existingSubmission?: {
    id: string;
    prompt_text: string;
    ai_result: string | null;
    result_url: string | null;
    file_url: string | null;
    participant_comment: string | null;
    status: string;
    submitted_at: string;
    is_late: boolean;
  } | null;
  bucketName: string;
}

function toSafeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .slice(0, 80);
}

export function SubmissionForm({
  taskId,
  deadline,
  existingSubmission,
  bucketName,
}: SubmissionFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const isFinalized = existingSubmission
    ? ["ai_evaluated", "expert_reviewed", "approved", "rejected"].includes(
        existingSubmission.status,
      )
    : false;

  const isPastDeadline = deadline ? Date.now() > new Date(deadline).getTime() : false;
  const isLocked = isFinalized || isPastDeadline;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      prompt_text: existingSubmission?.prompt_text ?? "",
      ai_result: existingSubmission?.ai_result ?? "",
      result_url: existingSubmission?.result_url ?? "",
      participant_comment: existingSubmission?.participant_comment ?? "",
    },
  });

  useEffect(() => {
    reset({
      prompt_text: existingSubmission?.prompt_text ?? "",
      ai_result: existingSubmission?.ai_result ?? "",
      result_url: existingSubmission?.result_url ?? "",
      participant_comment: existingSubmission?.participant_comment ?? "",
    });
  }, [existingSubmission, reset]);

  useEffect(() => {
    if (!supabase || !existingSubmission?.file_url) {
      setFilePreviewUrl(null);
      return;
    }

    void supabase.storage
      .from(bucketName)
      .createSignedUrl(existingSubmission.file_url, 60 * 10)
      .then(({ data }) => {
        setFilePreviewUrl(data?.signedUrl ?? null);
      });
  }, [supabase, existingSubmission?.file_url, bucketName]);

  const onSubmit = async (values: SubmissionInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan. .env qiymatlarini tekshiring.");
      return;
    }

    setError(null);
    setNotice(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessiya topilmadi. Qayta kiring.");
      return;
    }

    let uploadedPath = existingSubmission?.file_url ?? null;

    if (file) {
      const filePath = `${user.id}/${taskId}/${Date.now()}-${toSafeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        setError(`Fayl yuklashda xatolik: ${uploadError.message}`);
        return;
      }

      uploadedPath = filePath;
    }

    const payload = {
      prompt_text: values.prompt_text.trim(),
      ai_result: values.ai_result?.trim() || null,
      result_url: values.result_url?.trim() || null,
      file_url: uploadedPath,
      participant_comment: values.participant_comment?.trim() || null,
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };

    if (existingSubmission) {
      const { error: updateError } = await supabase
        .from("submissions")
        .update(payload)
        .eq("id", existingSubmission.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("submissions").insert({
        task_id: taskId,
        participant_id: user.id,
        ...payload,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setNotice("Topshiriq yuborildi. AI baholash navbatga qoshildi.");
    setFile(null);
    router.refresh();
  };

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Topshiriqni yuborish</CardTitle>
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
        {isLocked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Bu topshiriq uchun tahrirlash yopiq. Deadline yoki tasdiqlash holatini tekshiring.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Prompt matni</label>
            <Textarea rows={4} {...register("prompt_text")} disabled={isLocked} />
            {errors.prompt_text && (
              <p className="text-xs text-rose-600">{errors.prompt_text.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">AI natijasi</label>
            <Textarea rows={4} {...register("ai_result")} disabled={isLocked} />
            {errors.ai_result && (
              <p className="text-xs text-rose-600">{errors.ai_result.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Natija havolasi</label>
            <Input type="url" placeholder="https://" {...register("result_url")} disabled={isLocked} />
            {errors.result_url && (
              <p className="text-xs text-rose-600">{errors.result_url.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Fayl yuklash (ixtiyoriy)</label>
            <Input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={isLocked}
            />
            {filePreviewUrl && (
              <a
                href={filePreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline"
              >
                Yuklangan faylni korish
              </a>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Izoh</label>
            <Textarea rows={3} {...register("participant_comment")} disabled={isLocked} />
            {errors.participant_comment && (
              <p className="text-xs text-rose-600">{errors.participant_comment.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={isSubmitting || isLocked}
          >
            {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
