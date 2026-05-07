"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export default function ProfilePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!supabase) {
      setError("Supabase sozlanmagan.");
      setLoading(false);
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setError("Sessiya topilmadi.");
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("full_name, phone, organization, region, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          reset({
            full_name: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            organization: profile?.organization ?? "",
            region: profile?.region ?? "",
            avatar_url: profile?.avatar_url ?? "",
          });
          setLoading(false);
        });
    });
  }, [supabase, reset]);

  const onSubmit = async (values: ProfileInput) => {
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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        phone: values.phone || null,
        organization: values.organization || null,
        region: values.region || null,
        avatar_url: values.avatar_url || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Profil yangilandi.");
  };

  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Profil malumotlari</CardTitle>
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
        {loading ? (
          <p className="text-sm text-slate-600">Yuklanmoqda...</p>
        ) : (
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
              <Input placeholder="Avatar URL" {...register("avatar_url")} />
              {errors.avatar_url && (
                <p className="text-xs text-rose-600">{errors.avatar_url.message}</p>
              )}
            </div>
            <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting}>
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
