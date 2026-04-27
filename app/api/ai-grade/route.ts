import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRITERION_LIMITS = {
  criterion_1_score: 20,
  criterion_2_score: 15,
  criterion_3_score: 15,
  criterion_4_score: 20,
  criterion_5_score: 10,
  criterion_6_score: 10,
  criterion_7_score: 10,
} as const;

type CriterionKey = keyof typeof CRITERION_LIMITS;

type AiEvaluationOutput = {
  criterion_1_score: number;
  criterion_2_score: number;
  criterion_3_score: number;
  criterion_4_score: number;
  criterion_5_score: number;
  criterion_6_score: number;
  criterion_7_score: number;
  ai_feedback: string;
};

const SYSTEM_PROMPT = `You are an LMS submission grader for the "Bir haftada AI" marathon.
Evaluate with strict compliance to these criteria and maximum points:
1) Task Relevance: 20
2) Prompt Quality: 15
3) Correct Tool Usage: 15
4) Practicality / Utility: 20
5) Creativity: 10
6) AI Result Analysis: 10
7) Timeliness: 10 (this is determined by platform timestamps; do not inflate this score)

Rules:
- Return JSON only.
- Keep each criterion score within its maximum.
- Use integer scores only.
- Keep feedback concise in Uzbek (3-6 short sentences).

JSON shape:
{
  "criterion_1_score": number,
  "criterion_2_score": number,
  "criterion_3_score": number,
  "criterion_4_score": number,
  "criterion_5_score": number,
  "criterion_6_score": number,
  "criterion_7_score": number,
  "ai_feedback": "string"
}`;

function getNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return num;
}

function clampScore(value: unknown, max: number): number {
  const numeric = Math.round(getNumber(value));
  return Math.max(0, Math.min(max, numeric));
}

function extractJsonObject(input: string): string {
  const fencedMatch = input.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = input.indexOf("{");
  const lastBrace = input.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return input.slice(firstBrace, lastBrace + 1);
  }

  return "{}";
}

function parseModelPayload(raw: string): Record<string, unknown> {
  const text = extractJsonObject(raw);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function calculateTimelinessScore(
  submittedAt: string,
  deadline: string | null,
): number {
  if (!deadline) {
    return CRITERION_LIMITS.criterion_7_score;
  }

  const submittedAtMs = new Date(submittedAt).getTime();
  const deadlineMs = new Date(deadline).getTime();

  if (Number.isNaN(submittedAtMs) || Number.isNaN(deadlineMs)) {
    return CRITERION_LIMITS.criterion_7_score;
  }

  return submittedAtMs <= deadlineMs ? CRITERION_LIMITS.criterion_7_score : 0;
}

function normalizeEvaluation(
  payload: Record<string, unknown>,
  timelinessScore: number,
): AiEvaluationOutput {
  const normalized: AiEvaluationOutput = {
    criterion_1_score: clampScore(
      payload.criterion_1_score,
      CRITERION_LIMITS.criterion_1_score,
    ),
    criterion_2_score: clampScore(
      payload.criterion_2_score,
      CRITERION_LIMITS.criterion_2_score,
    ),
    criterion_3_score: clampScore(
      payload.criterion_3_score,
      CRITERION_LIMITS.criterion_3_score,
    ),
    criterion_4_score: clampScore(
      payload.criterion_4_score,
      CRITERION_LIMITS.criterion_4_score,
    ),
    criterion_5_score: clampScore(
      payload.criterion_5_score,
      CRITERION_LIMITS.criterion_5_score,
    ),
    criterion_6_score: clampScore(
      payload.criterion_6_score,
      CRITERION_LIMITS.criterion_6_score,
    ),
    criterion_7_score: clampScore(
      timelinessScore,
      CRITERION_LIMITS.criterion_7_score,
    ),
    ai_feedback:
      typeof payload.ai_feedback === "string" && payload.ai_feedback.trim().length > 0
        ? payload.ai_feedback.trim().slice(0, 1200)
        : "Ish avtomatik baholandi. Ekspert tekshiruvi bilan yakuniy ball tasdiqlanadi.",
  };

  return normalized;
}

function computeTotalScore(scores: AiEvaluationOutput): number {
  return (
    scores.criterion_1_score +
    scores.criterion_2_score +
    scores.criterion_3_score +
    scores.criterion_4_score +
    scores.criterion_5_score +
    scores.criterion_6_score +
    scores.criterion_7_score
  );
}

function buildUserPrompt(input: {
  taskTitle: string;
  taskDescription: string;
  instructionMarkdown: string;
  promptText: string;
  workLink: string | null;
  fileUrl: string | null;
  submittedAt: string;
  deadline: string | null;
}): string {
  return [
    `Task title: ${input.taskTitle}`,
    `Task description: ${input.taskDescription || "N/A"}`,
    `Task instruction: ${input.instructionMarkdown || "N/A"}`,
    `Submission prompt text: ${input.promptText || "N/A"}`,
    `Submission work link: ${input.workLink || "N/A"}`,
    `Submission file URL: ${input.fileUrl || "N/A"}`,
    `Submitted at: ${input.submittedAt}`,
    `Task deadline: ${input.deadline || "N/A"}`,
    "Evaluate fairly and strictly based on the criteria.",
  ].join("\n");
}

async function gradeWithOpenAI(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return parseModelPayload(content);
}

async function gradeWithGemini(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
  });

  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${prompt}`);
  const text = result.response.text();

  return parseModelPayload(text);
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.AI_GRADING_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");

  if (expectedSecret && expectedSecret !== providedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    submissionId?: string;
    provider?: "openai" | "gemini";
  } | null;

  const submissionId = body?.submissionId;

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin credentials are not configured." },
      { status: 500 },
    );
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, task_id, prompt_text, work_link, file_url, submitted_at")
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    return NextResponse.json(
      { error: "Submission not found." },
      { status: 404 },
    );
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, description, instruction_markdown, deadline")
    .eq("id", submission.task_id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const provider = body?.provider ??
    (process.env.AI_PROVIDER === "gemini" ? "gemini" : "openai");

  const inputPrompt = buildUserPrompt({
    taskTitle: String(task.title ?? ""),
    taskDescription: String(task.description ?? ""),
    instructionMarkdown: String(task.instruction_markdown ?? ""),
    promptText: String(submission.prompt_text ?? ""),
    workLink: submission.work_link,
    fileUrl: submission.file_url,
    submittedAt: String(submission.submitted_at),
    deadline: task.deadline,
  });

  let rawPayload: Record<string, unknown>;

  try {
    rawPayload =
      provider === "gemini"
        ? await gradeWithGemini(inputPrompt)
        : await gradeWithOpenAI(inputPrompt);
  } catch (error) {
    return NextResponse.json(
      {
        error: "AI provider request failed.",
        details: error instanceof Error ? error.message : "Unknown AI error",
      },
      { status: 502 },
    );
  }

  const timelinessScore = calculateTimelinessScore(
    String(submission.submitted_at),
    task.deadline,
  );
  const scores = normalizeEvaluation(rawPayload, timelinessScore);
  const aiScore = computeTotalScore(scores);

  const { error: gradeError } = await supabase.from("grades").upsert(
    {
      submission_id: submission.id,
      expert_id: null,
      ai_score: aiScore,
      final_score: aiScore,
      criterion_1_score: scores.criterion_1_score,
      criterion_2_score: scores.criterion_2_score,
      criterion_3_score: scores.criterion_3_score,
      criterion_4_score: scores.criterion_4_score,
      criterion_5_score: scores.criterion_5_score,
      criterion_6_score: scores.criterion_6_score,
      criterion_7_score: scores.criterion_7_score,
      ai_feedback: scores.ai_feedback,
      expert_comment: null,
    },
    { onConflict: "submission_id" },
  );

  if (gradeError) {
    return NextResponse.json(
      { error: "Failed to save grading result.", details: gradeError.message },
      { status: 500 },
    );
  }

  const { error: statusUpdateError } = await supabase
    .from("submissions")
    .update({ status: "graded" })
    .eq("id", submission.id);

  if (statusUpdateError) {
    return NextResponse.json(
      {
        error: "Graded, but failed to update submission status.",
        details: statusUpdateError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    provider,
    aiScore,
    criteria: scores,
  });
}
