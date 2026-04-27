"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogIn } from "lucide-react";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AdminDashboardData, ExportEntity } from "@/lib/types";

interface DashboardResponse {
  data: AdminDashboardData;
  mode: "demo" | "live";
}

function extractFileName(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const match = /filename\*?=(?:UTF-8''|\")?([^";\n]+)/i.exec(contentDisposition);
  if (!match?.[1]) {
    return fallback;
  }

  return decodeURIComponent(match[1].replace(/\"/g, "")).trim();
}

export function AdminConsole() {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [exportingEntity, setExportingEntity] = useState<ExportEntity | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (nextSession: Session | null) => {
      try {
        setIsLoading(true);
        setError(null);

        if (supabase && !nextSession?.access_token) {
          setDashboardData(null);
          return;
        }

        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          headers: {
            ...(nextSession?.access_token
              ? { Authorization: `Bearer ${nextSession.access_token}` }
              : {}),
          },
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | DashboardResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload && "error" in payload && payload.error
            ? payload.error
            : "Dashboard ma'lumotini olishda xatolik.");
        }

        if (!payload || !("data" in payload)) {
          throw new Error("Dashboard javobi noto'g'ri formatda.");
        }

        setDashboardData(payload.data);
        setMode(payload.mode === "live" ? "live" : "demo");
      } catch (fetchError) {
        setDashboardData(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Dashboard ma'lumotini olishda noma'lum xatolik.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      void fetchDashboard(null);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      void fetchDashboard(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void fetchDashboard(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchDashboard]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setIsAuthLoading(true);
    setError(null);
    setNotice(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsAuthLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setNotice("Admin panelga muvaffaqiyatli kirdingiz.");
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setNotice("Tizimdan chiqdingiz.");
  };

  const handleExport = async (entity: ExportEntity) => {
    setExportingEntity(entity);
    setError(null);

    try {
      const response = await fetch(`/api/admin/export?entity=${entity}`, {
        method: "GET",
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Export jarayonida xatolik.");
      }

      const blob = await response.blob();
      const fallbackFileName = `aimarafon-${entity}.xlsx`;
      const contentDisposition = response.headers.get("content-disposition");
      const fileName = extractFileName(contentDisposition, fallbackFileName);

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Exportda noma'lum xatolik.");
    } finally {
      setExportingEntity(null);
    }
  };

  const liveModeRequiresAuth = !!supabase;

  return (
    <main>
      <div className="space-y-4">
        {mode === "demo" && (
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Demo mode: Supabase server env qiymatlari yo'q. Ma'lumotlar test datasetdan olinmoqda.
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-slate-300">Admin panel yuklanmoqda...</CardContent>
          </Card>
        ) : liveModeRequiresAuth && !session ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-cyan-300" />
                Staff login
              </CardTitle>
              <CardDescription>
                Admin yoki expert akkaunt bilan tizimga kiring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="grid gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Parol"
                  required
                />
                <Button type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? "Kirilmoqda..." : "Kirish"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : dashboardData ? (
          <AdminDashboard
            data={dashboardData}
            onExport={handleExport}
            exportingEntity={exportingEntity}
            userLabel={session?.user?.email ?? null}
            onSignOut={liveModeRequiresAuth ? handleSignOut : undefined}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-300">
              Dashboard ma'lumoti hozircha mavjud emas.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
