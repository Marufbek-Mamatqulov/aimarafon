"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  Lock,
  LogIn,
  LogOut,
  Rocket,
  ShieldCheck,
  Trophy,
  Upload,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { demoLeaderboard, demoProfile, demoSubmissions, demoTasks } from "@/lib/participant-demo";
import type {
  LeaderboardEntry,
  ParticipantProfile,
  ParticipantSubmission,
  ParticipantTask,
} from "@/lib/participant-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const submissionBucket = process.env.NEXT_PUBLIC_SUBMISSION_BUCKET || "submission-files";
const marathonStartDateRaw = process.env.NEXT_PUBLIC_MARATHON_START_DATE || "";

function parseMarathonStartDate(): Date | null {
  if (!marathonStartDateRaw) {
    return null;
  }

  const parsed = new Date(marathonStartDateRaw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isTaskDateUnlocked(dayNumber: number): boolean {
  const startDate = parseMarathonStartDate();
  if (!startDate) {
    return false;
  }

  const unlockDate = new Date(startDate);
  unlockDate.setDate(unlockDate.getDate() + dayNumber - 1);

  return new Date() >= unlockDate;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Noma'lum vaqt";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toSafeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .slice(0, 80);
}

function mapSubmissionRows(rows: Record<string, unknown>[]): ParticipantSubmission[] {
  return rows.map((row) => {
    const gradesRaw = row.grades;
    const grade = Array.isArray(gradesRaw)
      ? (gradesRaw[0] as Record<string, unknown> | undefined)
      : (gradesRaw as Record<string, unknown> | null);

    return {
      id: String(row.id),
      task_id: String(row.task_id),
      prompt_text: String(row.prompt_text ?? ""),
      work_link: row.work_link ? String(row.work_link) : null,
      file_url: row.file_url ? String(row.file_url) : null,
      status: row.status === "graded" ? "graded" : "pending",
      submitted_at: String(row.submitted_at ?? new Date().toISOString()),
      ai_score:
        typeof grade?.ai_score === "number"
          ? grade.ai_score
          : grade?.ai_score
            ? Number(grade.ai_score)
            : null,
      final_score:
        typeof grade?.final_score === "number"
          ? grade.final_score
          : grade?.final_score
            ? Number(grade.final_score)
            : null,
    };
  });
}

function mapTaskRows(rows: Record<string, unknown>[]): ParticipantTask[] {
  return rows.map((row) => ({
    id: String(row.id),
    day_number: Number(row.day_number ?? 0),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    video_url: row.video_url ? String(row.video_url) : null,
    instruction_markdown: String(row.instruction_markdown ?? ""),
    deadline: String(row.deadline ?? new Date().toISOString()),
  }));
}

async function loadLeaderboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ top: LeaderboardEntry[]; currentUser: LeaderboardEntry | null }> {
  const [topRowsResult, selfResult] = await Promise.all([
    supabase.from("leaderboard").select("user_id, total_points, rank").order("rank").limit(10),
    supabase.from("leaderboard").select("user_id, total_points, rank").eq("user_id", userId).maybeSingle(),
  ]);

  if (topRowsResult.error) {
    throw new Error(topRowsResult.error.message);
  }

  const topRows = (topRowsResult.data ?? []) as Array<Record<string, unknown>>;
  const selfRow = (selfResult.data ?? null) as Record<string, unknown> | null;

  const idSet = new Set<string>();
  for (const row of topRows) {
    idSet.add(String(row.user_id));
  }
  if (selfRow?.user_id) {
    idSet.add(String(selfRow.user_id));
  }

  const ids = Array.from(idSet);

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, region")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profileMap = new Map<string, { fullName: string; region: string }>();
  for (const profile of profileRows ?? []) {
    profileMap.set(String(profile.id), {
      fullName: String(profile.full_name ?? "Ismsiz"),
      region: String(profile.region ?? "Noma'lum"),
    });
  }

  const top: LeaderboardEntry[] = topRows.map((row) => {
    const id = String(row.user_id);
    const profile = profileMap.get(id);

    return {
      user_id: id,
      full_name: profile?.fullName ?? "Participant",
      region: profile?.region ?? "Noma'lum",
      total_points: Number(row.total_points ?? 0),
      rank: Number(row.rank ?? 0),
    };
  });

  const currentUser: LeaderboardEntry | null = selfRow
    ? {
        user_id: String(selfRow.user_id),
        full_name: profileMap.get(String(selfRow.user_id))?.fullName ?? "Participant",
        region: profileMap.get(String(selfRow.user_id))?.region ?? "Noma'lum",
        total_points: Number(selfRow.total_points ?? 0),
        rank: Number(selfRow.rank ?? 0),
      }
    : null;

  return { top, currentUser };
}

export function ParticipantDashboard() {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [tasks, setTasks] = useState<ParticipantTask[]>([]);
  const [submissions, setSubmissions] = useState<ParticipantSubmission[]>([]);
  const [leaderboardTop, setLeaderboardTop] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSelf, setLeaderboardSelf] = useState<LeaderboardEntry | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [promptText, setPromptText] = useState("");
  const [workLink, setWorkLink] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRegion, setAuthRegion] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDemoMode = !supabase;

  const loadAllData = useCallback(
    async (userId: string) => {
      if (!supabase) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [profileResult, tasksResult, submissionsResult, leaderboardResult] =
          await Promise.all([
            supabase.from("profiles").select("id, full_name, email, role").eq("id", userId).single(),
            supabase
              .from("tasks")
              .select("id, day_number, title, description, video_url, instruction_markdown, deadline")
              .order("day_number"),
            supabase
              .from("submissions")
              .select(
                "id, task_id, prompt_text, work_link, file_url, status, submitted_at, grades(ai_score, final_score)",
              )
              .eq("user_id", userId)
              .order("submitted_at", { ascending: false }),
            loadLeaderboard(supabase, userId),
          ]);

        if (profileResult.error) {
          throw new Error(profileResult.error.message);
        }
        if (tasksResult.error) {
          throw new Error(tasksResult.error.message);
        }
        if (submissionsResult.error) {
          throw new Error(submissionsResult.error.message);
        }

        const profileRow = profileResult.data as Record<string, unknown>;
        setProfile({
          id: String(profileRow.id),
          full_name: String(profileRow.full_name ?? "Participant"),
          email: String(profileRow.email ?? ""),
          role: (profileRow.role === "admin" || profileRow.role === "expert"
            ? profileRow.role
            : "participant") as ParticipantProfile["role"],
        });

        const mappedTasks = mapTaskRows((tasksResult.data ?? []) as Record<string, unknown>[]);
        setTasks(mappedTasks);
        setSubmissions(mapSubmissionRows((submissionsResult.data ?? []) as Record<string, unknown>[]));

        setLeaderboardTop(leaderboardResult.top);
        setLeaderboardSelf(leaderboardResult.currentUser);

        setSelectedTaskId((currentSelectedTaskId) => {
          if (currentSelectedTaskId && mappedTasks.some((task) => task.id === currentSelectedTaskId)) {
            return currentSelectedTaskId;
          }
          return mappedTasks[0]?.id ?? null;
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Ma'lumotlarni olishda xatolik.");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setProfile(demoProfile);
      setTasks(demoTasks);
      setSubmissions(demoSubmissions);
      setLeaderboardTop(demoLeaderboard.slice(0, 10));
      setLeaderboardSelf(demoLeaderboard.find((item) => item.user_id === demoProfile.id) ?? null);
      setSelectedTaskId(demoTasks[0]?.id ?? null);
      setNotice("Demo rejim: Supabase env qiymatlari kiritilmagani uchun test ma'lumotlar ko'rsatilmoqda.");
      setIsLoading(false);
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
      if (data.session?.user?.id) {
        void loadAllData(data.session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        void loadAllData(nextSession.user.id);
      } else {
        setProfile(null);
        setTasks([]);
        setSubmissions([]);
        setLeaderboardTop([]);
        setLeaderboardSelf(null);
        setSelectedTaskId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadAllData]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      return;
    }

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grades" },
        () => {
          void loadLeaderboard(supabase, session.user.id)
            .then(({ top, currentUser }) => {
              setLeaderboardTop(top);
              setLeaderboardSelf(currentUser);
            })
            .catch(() => {
              // Ignore transient realtime errors.
            });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, session?.user?.id]);

  const taskById = useMemo(() => {
    const map = new Map<string, ParticipantTask>();
    for (const task of tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [tasks]);

  const submittedDays = useMemo(() => {
    const set = new Set<number>();
    for (const submission of submissions) {
      const task = taskById.get(submission.task_id);
      if (task) {
        set.add(task.day_number);
      }
    }
    return set;
  }, [submissions, taskById]);

  const taskStates = useMemo(() => {
    return tasks.map((task) => {
      const submission = submissions.find((item) => item.task_id === task.id) ?? null;
      const previousDaySubmitted = task.day_number === 1 || submittedDays.has(task.day_number - 1);
      const dateUnlocked = isTaskDateUnlocked(task.day_number);
      const unlocked = previousDaySubmitted || dateUnlocked;

      return {
        task,
        submission,
        unlocked,
      };
    });
  }, [tasks, submissions, submittedDays]);

  const selectedTaskState = useMemo(
    () => taskStates.find((item) => item.task.id === selectedTaskId) ?? taskStates[0] ?? null,
    [taskStates, selectedTaskId],
  );

  useEffect(() => {
    if (!selectedTaskState) {
      setPromptText("");
      setWorkLink("");
      setFile(null);
      return;
    }

    setPromptText(selectedTaskState.submission?.prompt_text ?? "");
    setWorkLink(selectedTaskState.submission?.work_link ?? "");
    setFile(null);
  }, [selectedTaskState?.task.id, selectedTaskState?.submission?.id]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setAuthLoading(true);
    setError(null);
    setNotice(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    setAuthLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setNotice("Muvaffaqiyatli kirdingiz.");
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setAuthLoading(true);
    setError(null);
    setNotice(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        data: {
          full_name: authFullName,
          region: authRegion,
        },
      },
    });

    setAuthLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      setNotice("Ro'yxatdan o'tish yakunlandi va tizimga kirildi.");
      return;
    }

    setNotice("Ro'yxatdan o'tdingiz. Email tasdiqlash havolasini tekshiring.");
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setNotice("Tizimdan chiqdingiz.");
  };

  const handleSubmitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !session?.user?.id || !selectedTaskState) {
      return;
    }

    if (!selectedTaskState.unlocked) {
      setError("Bu topshiriq hozircha yopiq. Oldingi kun topshirig'ini yakunlang.");
      return;
    }

    if (!promptText.trim()) {
      setError("Prompt Text kiritish majburiy.");
      return;
    }

    if (selectedTaskState.submission?.status === "graded") {
      setError("Bu topshiriq allaqachon graded. Qayta tahrirlash mumkin emas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      let uploadedFileUrl = selectedTaskState.submission?.file_url ?? null;

      if (file) {
        const filePath = `${session.user.id}/${selectedTaskState.task.id}/${Date.now()}-${toSafeFileName(
          file.name,
        )}`;

        const { error: uploadError } = await supabase.storage
          .from(submissionBucket)
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(`Fayl yuklashda xatolik: ${uploadError.message}`);
        }

        uploadedFileUrl = filePath;
      }

      if (selectedTaskState.submission) {
        const { error: updateError } = await supabase
          .from("submissions")
          .update({
            prompt_text: promptText.trim(),
            work_link: workLink.trim() ? workLink.trim() : null,
            file_url: uploadedFileUrl,
            submitted_at: new Date().toISOString(),
            status: "pending",
          })
          .eq("id", selectedTaskState.submission.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase.from("submissions").insert({
          user_id: session.user.id,
          task_id: selectedTaskState.task.id,
          prompt_text: promptText.trim(),
          work_link: workLink.trim() ? workLink.trim() : null,
          file_url: uploadedFileUrl,
          status: "pending",
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      await loadAllData(session.user.id);
      setNotice("Topshiriq muvaffaqiyatli yuborildi. AI baholash navbatga qo'shildi.");
      setFile(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Yuborishda xatolik.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }
    return Math.round((submissions.length / tasks.length) * 100);
  }, [submissions.length, tasks.length]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-purple-950/50 p-6 card-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              Participant Dashboard
            </p>
            <h1 className="font-[var(--font-heading)] text-2xl font-semibold text-white sm:text-3xl">
              Bir haftada AI - topshiriqlar markazi
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Har kun uchun vazifani ketma-ket bajaring, ish havolasini yuboring va real-time
              leaderboarddagi o'rningizni kuzating.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profile ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {profile.full_name}
                </Badge>
                {!isDemoMode && (
                  <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    Chiqish
                  </Button>
                )}
              </>
            ) : (
              <Badge variant="outline" className="gap-1">
                <LogIn className="h-3.5 w-3.5" />
                Kirish talab qilinadi
              </Badge>
            )}
          </div>
        </div>
      </header>

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
          <CardContent className="p-6 text-slate-300">Yuklanmoqda...</CardContent>
        </Card>
      ) : !profile && !isDemoMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Platformaga kirish</CardTitle>
            <CardDescription>
              Participant sifatida vazifalarni ko'rish va yuborish uchun tizimga kiring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 inline-flex rounded-lg border border-slate-700 bg-slate-900/70 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  authMode === "login" ? "bg-cyan-400/20 text-cyan-100" : "text-slate-300"
                }`}
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  authMode === "signup" ? "bg-purple-400/20 text-purple-100" : "text-slate-300"
                }`}
              >
                Ro'yxatdan o'tish
              </button>
            </div>

            <form
              onSubmit={authMode === "login" ? handleSignIn : handleSignUp}
              className="grid gap-3"
            >
              {authMode === "signup" && (
                <>
                  <Input
                    value={authFullName}
                    onChange={(event) => setAuthFullName(event.target.value)}
                    placeholder="To'liq ism"
                    required
                  />
                  <Input
                    value={authRegion}
                    onChange={(event) => setAuthRegion(event.target.value)}
                    placeholder="Hudud (masalan, Samarqand)"
                  />
                </>
              )}
              <Input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email"
                required
              />
              <Input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Parol"
                required
                minLength={6}
              />
              <Button type="submit" disabled={authLoading}>
                {authLoading
                  ? "Yuborilmoqda..."
                  : authMode === "login"
                    ? "Kirish"
                    : "Ro'yxatdan o'tish"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-cyan-300" />
                  7 kunlik topshiriqlar
                </CardTitle>
                <CardDescription>Ketma-ketlik asosida ochiladi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {taskStates.map(({ task, submission, unlocked }) => {
                  const isSelected = selectedTaskState?.task.id === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-cyan-300/50 bg-cyan-500/10"
                          : "border-slate-700/60 bg-slate-900/40 hover:border-cyan-300/30"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-100">Day {task.day_number}</p>
                        {submission ? (
                          <Badge variant={submission.status === "graded" ? "secondary" : "default"}>
                            {submission.status}
                          </Badge>
                        ) : unlocked ? (
                          <Badge variant="outline">Open</Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-300">{task.title}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-8">
              {selectedTaskState ? (
                <>
                  <CardHeader>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge>Day {selectedTaskState.task.day_number}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Deadline: {formatDate(selectedTaskState.task.deadline)}
                      </Badge>
                    </div>
                    <CardTitle>{selectedTaskState.task.title}</CardTitle>
                    <CardDescription>{selectedTaskState.task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
                      <p className="mb-2 text-xs uppercase tracking-wider text-cyan-300">
                        Instruction
                      </p>
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-200">
                        {selectedTaskState.task.instruction_markdown}
                      </p>
                      {selectedTaskState.task.video_url && (
                        <a
                          href={selectedTaskState.task.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-sm text-cyan-300 underline-offset-4 hover:underline"
                        >
                          Video qo'llanmani ochish
                        </a>
                      )}
                    </div>

                    <form onSubmit={handleSubmitTask} className="space-y-3">
                      <Textarea
                        value={promptText}
                        onChange={(event) => setPromptText(event.target.value)}
                        placeholder="Prompt Text ni shu yerga yozing"
                        required
                        disabled={!selectedTaskState.unlocked || isDemoMode}
                      />

                      <Input
                        value={workLink}
                        onChange={(event) => setWorkLink(event.target.value)}
                        placeholder="Work Link (Canva / Gamma)"
                        disabled={!selectedTaskState.unlocked || isDemoMode}
                      />

                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null;
                          setFile(nextFile);
                        }}
                        disabled={!selectedTaskState.unlocked || isDemoMode}
                      />

                      {selectedTaskState.submission?.file_url && (
                        <p className="text-xs text-slate-400">
                          Yuklangan fayl yo'li: {selectedTaskState.submission.file_url}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="submit"
                          disabled={
                            !selectedTaskState.unlocked ||
                            isSubmitting ||
                            isDemoMode ||
                            selectedTaskState.submission?.status === "graded"
                          }
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isSubmitting ? "Yuborilmoqda..." : "Topshiriqni yuborish"}
                        </Button>

                        {selectedTaskState.submission?.status === "graded" && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Yakuniy ball: {selectedTaskState.submission.final_score ?? 0}
                          </Badge>
                        )}

                        {!selectedTaskState.unlocked && (
                          <Badge variant="danger" className="gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            Avval oldingi kun topshirig'ini yuboring
                          </Badge>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6 text-slate-300">Topshiriqlar topilmadi.</CardContent>
              )}
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-300" /> Leaderboard
                </CardTitle>
                <CardDescription>Eng yaxshi natijalar va sizning o'rningiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboardTop.length === 0 ? (
                  <p className="text-sm text-slate-400">Hozircha leaderboard bo'sh.</p>
                ) : (
                  leaderboardTop.map((entry) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-100">#{entry.rank} {entry.full_name}</p>
                        <p className="text-xs text-slate-400">{entry.region}</p>
                      </div>
                      <p className="text-sm font-semibold text-cyan-200">{entry.total_points}</p>
                    </div>
                  ))
                )}

                {leaderboardSelf && !leaderboardTop.some((item) => item.user_id === leaderboardSelf.user_id) && (
                  <div className="rounded-xl border border-purple-300/30 bg-purple-500/10 px-3 py-2">
                    <p className="text-sm text-purple-100">
                      Sizning o'rningiz: #{leaderboardSelf.rank} ({leaderboardSelf.total_points} ball)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-cyan-300" /> Progress
                </CardTitle>
                <CardDescription>Topshirilgan vazifalar va baholash holati</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mb-4 text-sm text-slate-300">
                  Bajarilgan: {submissions.length}/{tasks.length} ({progress}%)
                </p>

                <div className="space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-sm text-slate-400">Hali topshiriq yuborilmadi.</p>
                  ) : (
                    submissions
                      .slice()
                      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
                      .map((submission) => {
                        const task = taskById.get(submission.task_id);
                        return (
                          <div
                            key={submission.id}
                            className="rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-slate-100">
                                Day {task?.day_number}: {task?.title ?? "Topshiriq"}
                              </p>
                              <Badge variant={submission.status === "graded" ? "secondary" : "default"}>
                                {submission.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              Yuborilgan vaqt: {formatDate(submission.submitted_at)}
                            </p>
                            {submission.final_score !== null && (
                              <p className="mt-1 text-xs text-cyan-200">
                                AI: {submission.ai_score ?? 0} | Final: {submission.final_score}
                              </p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
