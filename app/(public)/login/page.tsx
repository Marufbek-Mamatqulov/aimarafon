"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan. .env qiymatlarini tekshiring.");
      return;
    }

    setError(null);
    setNotice(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Login muvaffaqiyatsiz. Qayta urinib koring.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const nextPath = searchParams.get("next");

    if (nextPath) {
      router.push(nextPath);
      return;
    }

    if (profile?.role === "admin") {
      router.push("/admin");
      return;
    }

    if (profile?.role === "expert") {
      router.push("/expert");
      return;
    }

    router.push("/dashboard");
    setNotice("Muvaffaqiyatli kirdingiz.");
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Kirish</CardTitle>
          <p className="text-sm text-slate-600">
            Shaxsiy kabinetga kirish uchun email va parolni kiriting.
          </p>
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
              <Input type="email" placeholder="Email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input type="password" placeholder="Parol" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600">
            Hisobingiz yoqmi?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Royxatdan otish
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
