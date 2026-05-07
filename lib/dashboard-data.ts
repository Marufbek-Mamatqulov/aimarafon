import type {
  AdminDashboardData,
  GradingQueueItem,
  PlagiarismFlagItem,
} from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const fallbackDashboardData: AdminDashboardData = {
  stats: {
    registrations: 278,
    submissions: 912,
    graded: 645,
    plagiarismFlags: 17,
  },
  submissionsByDay: [
    { dayNumber: 1, submissions: 202 },
    { dayNumber: 2, submissions: 177 },
    { dayNumber: 3, submissions: 151 },
    { dayNumber: 4, submissions: 138 },
    { dayNumber: 5, submissions: 109 },
    { dayNumber: 6, submissions: 81 },
    { dayNumber: 7, submissions: 54 },
  ],
  regionalParticipation: [
    { region: "Toshkent shahri", participants: 74 },
    { region: "Samarqand", participants: 41 },
    { region: "Farg'ona", participants: 36 },
    { region: "Andijon", participants: 33 },
    { region: "Buxoro", participants: 27 },
  ],
  gradingQueue: [
    {
      submissionId: "demo-1",
      participantName: "Nodira Karimova",
      region: "Samarqand",
      taskTitle: "AI yordamida dars rejasi",
      dayNumber: 3,
      aiScore: 91,
      status: "pending",
      submittedAt: new Date().toISOString(),
    },
    {
      submissionId: "demo-2",
      participantName: "Sherzod Rahimov",
      region: "Toshkent shahri",
      taskTitle: "Canva + GPT bilan prezentatsiya",
      dayNumber: 5,
      aiScore: 88,
      status: "pending",
      submittedAt: new Date().toISOString(),
    },
  ],
  plagiarismFlags: [
    {
      sourceType: "work_link",
      duplicatedValue: "https://canva.com/design/demo-shared-link",
      duplicateCount: 3,
      submissionIds: ["demo-1", "demo-8", "demo-19"],
    },
  ],
};

function parseQueueItems(rawRows: unknown[] | null): GradingQueueItem[] {
  if (!rawRows) {
    return [];
  }

  return rawRows
    .map((row) => row as Record<string, unknown>)
    .map((row) => ({
      submissionId: String(row.submission_id ?? ""),
      participantName: String(row.participant_name ?? "Ismsiz"),
      region: String(row.region ?? "Noma'lum"),
      taskTitle: String(row.task_title ?? "Topshiriq"),
      dayNumber: Number(row.day_number ?? 0),
      aiScore: Number(row.ai_score ?? 0),
      status: (row.status === "graded" ? "graded" : "pending") as "graded" | "pending",
      submittedAt: String(row.submitted_at ?? new Date().toISOString()),
    }))
    .filter((item) => item.submissionId.length > 0);
}

function parsePlagiarismFlags(rawRows: unknown[] | null): PlagiarismFlagItem[] {
  if (!rawRows) {
    return [];
  }

  return rawRows
    .map((row) => row as Record<string, unknown>)
    .map((row) => {
      const sourceType: PlagiarismFlagItem["sourceType"] =
        row.source_type === "prompt_text" ? "prompt_text" : "work_link";

      return {
        sourceType,
        duplicatedValue: String(row.duplicated_value ?? ""),
        duplicateCount: Number(row.duplicate_count ?? 0),
        submissionIds: Array.isArray(row.submission_ids)
          ? row.submission_ids.map((id) => String(id))
          : [],
      };
    })
    .filter((item) => item.duplicatedValue.length > 0);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return fallbackDashboardData;
  }

  try {
    const [
      registrationsResult,
      submissionsResult,
      gradedResult,
      tasksResult,
      submissionsForStatsResult,
      regionalResult,
      queueResult,
      plagiarismSourceResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "participant"),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("status", ["ai_evaluated", "expert_reviewed", "approved"]),
      supabase.from("tasks").select("id, day_number").order("day_number"),
      supabase.from("submissions").select("id, task_id, status, submitted_at"),
      supabase
        .from("profiles")
        .select("region")
        .eq("role", "participant"),
      supabase
        .from("submissions")
        .select(
          "id, status, submitted_at, participant:profiles(full_name, region), task:tasks(title, day_number), evaluation:evaluations(total_score)",
        )
        .order("submitted_at", { ascending: false })
        .limit(15),
      supabase.from("submissions").select("id, prompt_text, result_url").limit(200),
    ]);

    if (
      registrationsResult.error ||
      submissionsResult.error ||
      gradedResult.error ||
      tasksResult.error ||
      submissionsForStatsResult.error ||
      regionalResult.error ||
      queueResult.error ||
      plagiarismSourceResult.error
    ) {
      return fallbackDashboardData;
    }

    const taskMap = new Map<string, number>();
    for (const task of tasksResult.data ?? []) {
      taskMap.set(String(task.id), Number(task.day_number ?? 0));
    }

    const submissionsByDay = new Map<number, number>();
    for (const submission of submissionsForStatsResult.data ?? []) {
      const dayNumber = taskMap.get(String(submission.task_id ?? "")) ?? 0;
      if (dayNumber > 0) {
        submissionsByDay.set(dayNumber, (submissionsByDay.get(dayNumber) ?? 0) + 1);
      }
    }

    const regionalCounts = new Map<string, number>();
    for (const profile of regionalResult.data ?? []) {
      const region = String(profile.region ?? "Noma'lum");
      regionalCounts.set(region, (regionalCounts.get(region) ?? 0) + 1);
    }

    const gradingQueue: GradingQueueItem[] = (queueResult.data ?? []).map((row) => {
      const participant = Array.isArray(row.participant) ? row.participant[0] : row.participant;
      const task = Array.isArray(row.task) ? row.task[0] : row.task;
      const evaluation = Array.isArray(row.evaluation) ? row.evaluation[0] : row.evaluation;
      const status =
        row.status === "ai_evaluated" || row.status === "expert_reviewed" || row.status === "approved"
          ? "graded"
          : "pending";

      return {
        submissionId: String(row.id ?? ""),
        participantName: String(participant?.full_name ?? "Ismsiz"),
        region: String(participant?.region ?? "Noma'lum"),
        taskTitle: String(task?.title ?? "Topshiriq"),
        dayNumber: Number(task?.day_number ?? 0),
        aiScore: Number(evaluation?.total_score ?? 0),
        status,
        submittedAt: String(row.submitted_at ?? new Date().toISOString()),
      };
    });

    const plagiarismFlags: PlagiarismFlagItem[] = [];
    const promptMap = new Map<string, string[]>();
    const linkMap = new Map<string, string[]>();

    for (const item of plagiarismSourceResult.data ?? []) {
      const promptKey = String(item.prompt_text ?? "").slice(0, 300).trim();
      if (promptKey.length > 0) {
        const bucket = promptMap.get(promptKey) ?? [];
        bucket.push(String(item.id));
        promptMap.set(promptKey, bucket);
      }

      const linkKey = String(item.result_url ?? "").trim();
      if (linkKey.length > 0) {
        const bucket = linkMap.get(linkKey) ?? [];
        bucket.push(String(item.id));
        linkMap.set(linkKey, bucket);
      }
    }

    for (const [value, ids] of linkMap.entries()) {
      if (ids.length > 1) {
        plagiarismFlags.push({
          sourceType: "work_link",
          duplicatedValue: value,
          duplicateCount: ids.length,
          submissionIds: ids,
        });
      }
    }

    for (const [value, ids] of promptMap.entries()) {
      if (ids.length > 1) {
        plagiarismFlags.push({
          sourceType: "prompt_text",
          duplicatedValue: value,
          duplicateCount: ids.length,
          submissionIds: ids,
        });
      }
    }

    plagiarismFlags.sort((a, b) => b.duplicateCount - a.duplicateCount);

    return {
      stats: {
        registrations: registrationsResult.count ?? 0,
        submissions: submissionsResult.count ?? 0,
        graded: gradedResult.count ?? 0,
        plagiarismFlags: plagiarismFlags.length,
      },
      submissionsByDay: Array.from(submissionsByDay.entries())
        .map(([dayNumber, submissions]) => ({ dayNumber, submissions }))
        .sort((a, b) => a.dayNumber - b.dayNumber),
      regionalParticipation: Array.from(regionalCounts.entries())
        .map(([region, participants]) => ({ region, participants }))
        .sort((a, b) => b.participants - a.participants),
      gradingQueue,
      plagiarismFlags: plagiarismFlags.slice(0, 25),
    };
  } catch {
    return fallbackDashboardData;
  }
}
