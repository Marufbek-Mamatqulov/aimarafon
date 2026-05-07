"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    if (!supabase) {
      setError("Supabase sozlanmagan. .env qiymatlarini tekshiring.");
      return;
    }

    setError(null);
    setNotice(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          phone: values.phone || null,
          organization: values.organization || null,
          region: values.region || null,
          rules_accepted: values.rules_accepted,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setNotice("Royxatdan otish yakunlandi. Email tasdiqlash havolasini tekshiring.");
  };

  return (
    <div className="mx-auto w-full max-w-lg py-10">
      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Royxatdan otish</CardTitle>
          <p className="text-sm text-slate-600">
            Marafonda ishtirok etish uchun malumotlarni toldiring.
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
              <Input placeholder="Tolik ism" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-rose-600">{errors.full_name.message}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Input placeholder="Telefon" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-rose-600">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Input placeholder="Hudud" {...register("region")} />
                {errors.region && (
                  <p className="text-xs text-rose-600">{errors.region.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Input placeholder="Tashkilot" {...register("organization")} />
              {errors.organization && (
                <p className="text-xs text-rose-600">{errors.organization.message}</p>
              )}
            </div>
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
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" className="mt-1 h-4 w-4" {...register("rules_accepted")} />
              <span>
                Men marafon <Link href="/rules" className="text-indigo-600">qoidalari</Link> bilan
                tanishdim va qabul qilaman.
              </span>
            </label>
            {errors.rules_accepted && (
              <p className="text-xs text-rose-600">{errors.rules_accepted.message}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Yuborilmoqda..." : "Royxatdan otish"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600">
            Avval royxatdan otganmisiz?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Kirish
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
