import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type StaffRole = "expert" | "admin";

type AuthorizationResult =
  | {
      ok: true;
      userId: string;
      role: StaffRole;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function authorizeStaffRequest(
  request: NextRequest,
  supabaseOverride?: SupabaseClient | null,
): Promise<AuthorizationResult> {
  const supabase = supabaseOverride ?? getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: 500,
      error: "Supabase admin credentials are not configured.",
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Missing Bearer token.",
    };
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      error: "Access token is empty.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired access token.",
    };
  }

  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError || !profile) {
    return {
      ok: false,
      status: 403,
      error: "User profile not found for authorization.",
    };
  }

  if (profile.role !== "admin" && profile.role !== "expert") {
    return {
      ok: false,
      status: 403,
      error: "Insufficient privileges for admin operation.",
    };
  }

  return {
    ok: true,
    userId: user.id,
    role: profile.role,
  };
}
