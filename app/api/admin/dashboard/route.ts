import { NextRequest, NextResponse } from "next/server";

import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeStaffRequest } from "@/lib/supabase/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  // Demo mode: return fallback dashboard without auth requirement.
  if (!supabase) {
    const data = await getAdminDashboardData();
    return NextResponse.json({ data, mode: "demo" });
  }

  const authorizationResult = await authorizeStaffRequest(request, supabase);
  if (!authorizationResult.ok) {
    return NextResponse.json(
      { error: authorizationResult.error },
      { status: authorizationResult.status },
    );
  }

  const data = await getAdminDashboardData();
  return NextResponse.json({ data, mode: "live" });
}
