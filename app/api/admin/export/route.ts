import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeStaffRequest } from "@/lib/supabase/authz";
import type { ExportEntity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildWorkbook(rows: Record<string, unknown>[], sheetName: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

function buildExcelResponse(buffer: Buffer, fileName: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${fileName}`,
    },
  });
}

export async function GET(request: NextRequest) {
  const entity = (request.nextUrl.searchParams.get("entity") || "users") as ExportEntity;

  const supabase = getSupabaseAdminClient();

  // Demo mode: no Supabase server credentials configured.
  if (!supabase) {
    if (entity === "users") {
      const buffer = buildWorkbook(
        [
          {
            id: "demo-user",
            full_name: "Demo Participant",
            email: "demo@aimarafon.uz",
            phone: "+998901112233",
            region: "Buxoro",
            organization: "Demo School",
            participant_code: "AI-2026-000001",
            role: "participant",
            created_at: new Date().toISOString(),
          },
        ],
        "users",
      );

      return buildExcelResponse(buffer, "aimarafon-users-demo.xlsx");
    }

    if (entity === "submissions") {
      const buffer = buildWorkbook(
        [
          {
            id: "demo-sub-1",
            participant_id: "demo-user",
            task_id: "task-day-1",
            prompt_text: "Siz metodistsiz. 45 daqiqalik dars rejasi yozing...",
            result_url: "https://gamma.app/demo-day-1",
            file_url: null,
            status: "ai_evaluated",
            submitted_at: new Date().toISOString(),
            is_late: false,
          },
        ],
        "submissions",
      );

      return buildExcelResponse(buffer, "aimarafon-submissions-demo.xlsx");
    }

    const buffer = buildWorkbook(
      [
        {
          rank: 1,
          total_score: 612,
          participant_id: "u1",
          participant_code: "AI-2026-000001",
          full_name: "Nodira Karimova",
          region: "Samarqand",
          organization: "Samarqand pedagogika",
          completed_tasks_count: 7,
        },
        {
          rank: 23,
          total_score: 88,
          participant_id: "demo-user",
          participant_code: "AI-2026-000023",
          full_name: "Demo Participant",
          region: "Buxoro",
          organization: "Demo School",
          completed_tasks_count: 1,
        },
      ],
      "final_results",
    );

    return buildExcelResponse(buffer, "aimarafon-final-results-demo.xlsx");
  }

  const authorizationResult = await authorizeStaffRequest(request, supabase);
  if (!authorizationResult.ok) {
    return NextResponse.json(
      { error: authorizationResult.error },
      { status: authorizationResult.status },
    );
  }

  if (entity === "users") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, region, organization, participant_code, role, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const buffer = buildWorkbook((data ?? []) as Record<string, unknown>[], "users");

    return buildExcelResponse(buffer, "aimarafon-users.xlsx");
  }

  if (entity === "submissions") {
    const { data, error } = await supabase
      .from("submissions")
      .select("id, participant_id, task_id, prompt_text, result_url, file_url, status, submitted_at, is_late")
      .order("submitted_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const buffer = buildWorkbook(
      (data ?? []) as Record<string, unknown>[],
      "submissions",
    );

    return buildExcelResponse(buffer, "aimarafon-submissions.xlsx");
  }

  if (entity === "results") {
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from("leaderboard_view")
      .select(
        "participant_id, participant_code, full_name, region, organization, total_score, completed_tasks_count, rank",
      )
      .order("rank");

    if (leaderboardError) {
      return NextResponse.json({ error: leaderboardError.message }, { status: 500 });
    }

    const rows = (leaderboard ?? []).map((entry) => ({
      rank: entry.rank,
      total_score: entry.total_score,
      participant_id: entry.participant_id,
      participant_code: entry.participant_code,
      full_name: entry.full_name,
      region: entry.region,
      organization: entry.organization,
      completed_tasks_count: entry.completed_tasks_count,
    }));

    const buffer = buildWorkbook(rows as Record<string, unknown>[], "final_results");

    return buildExcelResponse(buffer, "aimarafon-final-results.xlsx");
  }

  return NextResponse.json({ error: "Unsupported export entity." }, { status: 400 });
}
