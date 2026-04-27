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
      dayStatsResult,
      regionStatsResult,
      queueResult,
      plagiarismResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "participant"),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "graded"),
      supabase
        .from("daily_submission_stats")
        .select("day_number, submissions_count")
        .order("day_number"),
      supabase
        .from("regional_participation_stats")
        .select("region, participant_count")
        .order("participant_count", { ascending: false }),
      supabase
        .from("admin_grading_queue")
        .select(
          "submission_id, participant_name, region, task_title, day_number, ai_score, status, submitted_at",
        )
        .order("ai_score", { ascending: false })
        .limit(15),
      supabase
        .from("plagiarism_flags")
        .select("source_type, duplicated_value, duplicate_count, submission_ids")
        .order("duplicate_count", { ascending: false })
        .limit(25),
    ]);

    if (
      registrationsResult.error ||
      submissionsResult.error ||
      gradedResult.error ||
      dayStatsResult.error ||
      regionStatsResult.error ||
      queueResult.error ||
      plagiarismResult.error
    ) {
      return fallbackDashboardData;
    }

    const plagiarismFlags = parsePlagiarismFlags(plagiarismResult.data ?? null);

    return {
      stats: {
        registrations: registrationsResult.count ?? 0,
        submissions: submissionsResult.count ?? 0,
        graded: gradedResult.count ?? 0,
        plagiarismFlags: plagiarismFlags.length,
      },
      submissionsByDay: (dayStatsResult.data ?? []).map((row) => ({
        dayNumber: Number(row.day_number ?? 0),
        submissions: Number(row.submissions_count ?? 0),
      })),
      regionalParticipation: (regionStatsResult.data ?? []).map((row) => ({
        region: String(row.region ?? "Noma'lum"),
        participants: Number(row.participant_count ?? 0),
      })),
      gradingQueue: parseQueueItems(queueResult.data ?? null),
      plagiarismFlags,
    };
  } catch {
    return fallbackDashboardData;
  }
}
