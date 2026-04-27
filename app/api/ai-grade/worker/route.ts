import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.AI_GRADING_WEBHOOK_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const webhookMatches =
    !!expectedSecret && !!providedSecret && expectedSecret === providedSecret;
  const cronMatches = !!cronSecret && !!bearerToken && cronSecret === bearerToken;

  if (!expectedSecret && !cronSecret) {
    return true;
  }

  return webhookMatches || cronMatches;
}

async function processNextQueuedJob(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin credentials are not configured." },
      { status: 500 },
    );
  }

  const { data: queuedJob, error: queueError } = await supabase
    .from("ai_grading_jobs")
    .select("id, submission_id, attempts")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (queueError) {
    return NextResponse.json(
      { error: "Failed to read grading queue.", details: queueError.message },
      { status: 500 },
    );
  }

  if (!queuedJob) {
    return NextResponse.json({ ok: true, message: "No queued grading jobs." });
  }

  const { error: markProcessingError } = await supabase
    .from("ai_grading_jobs")
    .update({
      status: "processing",
      attempts: Number(queuedJob.attempts ?? 0) + 1,
      last_error: null,
    })
    .eq("id", queuedJob.id);

  if (markProcessingError) {
    return NextResponse.json(
      {
        error: "Failed to mark grading job as processing.",
        details: markProcessingError.message,
      },
      { status: 500 },
    );
  }

  const gradingResponse = await fetch(new URL("/api/ai-grade", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.AI_GRADING_WEBHOOK_SECRET
        ? { "x-webhook-secret": process.env.AI_GRADING_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({ submissionId: queuedJob.submission_id }),
  });

  if (!gradingResponse.ok) {
    const errorPayload = await gradingResponse.json().catch(() => null);

    await supabase
      .from("ai_grading_jobs")
      .update({
        status: "failed",
        last_error: JSON.stringify(errorPayload ?? { error: "Unknown grading error" }).slice(
          0,
          1000,
        ),
      })
      .eq("id", queuedJob.id);

    return NextResponse.json(
      {
        error: "Grading failed for queued job.",
        jobId: queuedJob.id,
        details: errorPayload,
      },
      { status: 502 },
    );
  }

  const { error: markDoneError } = await supabase
    .from("ai_grading_jobs")
    .update({
      status: "done",
      last_error: null,
    })
    .eq("id", queuedJob.id);

  if (markDoneError) {
    return NextResponse.json(
      {
        error: "Grading completed but queue status update failed.",
        details: markDoneError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Queued grading job processed successfully.",
    jobId: queuedJob.id,
    submissionId: queuedJob.submission_id,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return processNextQueuedJob(request);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return processNextQueuedJob(request);
}
