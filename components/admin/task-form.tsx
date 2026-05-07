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
import { taskSchema, type TaskInput } from "@/lib/validations/task";

interface TaskFormProps {
  marathonId: string;
  task?: {
    id: string;
    day_number: number;
    title: string;
    description: string;
    instruction: string | null;
    expected_output: string | null;
    deadline: string | null;
    max_score: number;
    is_published: boolean;
  } | null;
}

function toLocalDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function TaskForm({ marathonId, task }: TaskFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      day_number: task?.day_number ?? 1,
      title: task?.title ?? "",
      description: task?.description ?? "",
      instruction: task?.instruction ?? "",
      expected_output: task?.expected_output ?? "",
      deadline: toLocalDateTime(task?.deadline ?? null),
      max_score: task?.max_score ?? 100,
      is_published: task?.is_published ?? false,
    },
  });

  useEffect(() => {
    reset({
      day_number: task?.day_number ?? 1,
      title: task?.title ?? "",
      description: task?.description ?? "",
      instruction: task?.instruction ?? "",
      expected_output: task?.expected_output ?? "",
      deadline: toLocalDateTime(task?.deadline ?? null),
      max_score: task?.max_score ?? 100,
      is_published: task?.is_published ?? false,
    });
  }, [task, reset]);

  const onSubmit = async (values: TaskInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan.");
      return;
    }

    setNotice(null);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      marathon_id: marathonId,
      day_number: values.day_number,
      title: values.title.trim(),
      description: values.description.trim(),
      instruction: values.instruction?.trim() || null,
      expected_output: values.expected_output?.trim() || null,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      max_score: values.max_score,
      is_published: values.is_published ?? false,
      created_by: user?.id ?? null,
    };

    if (task?.id) {
      const { error: updateError } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", task.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNotice("Topshiriq yangilandi.");
      router.refresh();
      return;
    }

    const { error: insertError } = await supabase.from("tasks").insert(payload);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNotice("Topshiriq yaratildi.");
    router.push("/admin/tasks");
  };

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">
          {task ? "Topshiriqni tahrirlash" : "Yangi topshiriq"}
        </CardTitle>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Input type="number" placeholder="Kun raqami" {...register("day_number")} />
              {errors.day_number && (
                <p className="text-xs text-rose-600">{errors.day_number.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input type="number" placeholder="Maksimal ball" {...register("max_score")} />
              {errors.max_score && (
                <p className="text-xs text-rose-600">{errors.max_score.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Input placeholder="Sarlavha" {...register("title")} />
            {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Textarea rows={3} placeholder="Tavsif" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Textarea rows={3} placeholder="Korsatma" {...register("instruction")} />
          </div>
          <div className="space-y-1">
            <Textarea rows={3} placeholder="Kutilgan natija" {...register("expected_output")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Input type="datetime-local" {...register("deadline")} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...register("is_published")} />
              E lon qilish
            </label>
          </div>
          <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
