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
            workplace: "Demo School",
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
            user_id: "demo-user",
            task_id: "task-day-1",
            prompt_text: "Siz metodistsiz. 45 daqiqalik dars rejasi yozing...",
            work_link: "https://gamma.app/demo-day-1",
            file_url: null,
            status: "graded",
            submitted_at: new Date().toISOString(),
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
          total_points: 264,
          user_id: "u1",
          full_name: "Nodira Karimova",
          region: "Samarqand",
        },
        {
          rank: 23,
          total_points: 88,
          user_id: "demo-user",
          full_name: "Demo Participant",
          region: "Buxoro",
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
      .select("id, full_name, email, phone, region, workplace, role, created_at")
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
      .select("id, user_id, task_id, prompt_text, work_link, file_url, status, submitted_at")
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
    const [{ data: leaderboard, error: leaderboardError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabase.from("leaderboard").select("user_id, total_points, rank").order("rank"),
        supabase.from("profiles").select("id, full_name, region"),
      ]);

    if (leaderboardError || profilesError) {
      return NextResponse.json(
        {
          error: leaderboardError?.message || profilesError?.message || "Failed to export",
        },
        { status: 500 },
      );
    }

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [
        String(profile.id),
        {
          full_name: profile.full_name,
          region: profile.region,
        },
      ]),
    );

    const rows = (leaderboard ?? []).map((entry) => {
      const profile = profileMap.get(String(entry.user_id));
      return {
        rank: entry.rank,
        total_points: entry.total_points,
        user_id: entry.user_id,
        full_name: profile?.full_name ?? "",
        region: profile?.region ?? "",
      };
    });

    const buffer = buildWorkbook(rows as Record<string, unknown>[], "final_results");

    return buildExcelResponse(buffer, "aimarafon-final-results.xlsx");
  }

  return NextResponse.json({ error: "Unsupported export entity." }, { status: 400 });
}
