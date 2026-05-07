import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRITERION_LIMITS = {
  relevance_score: 20,
  prompt_quality_score: 15,
  ai_usage_score: 15,
  practical_value_score: 20,
  creativity_score: 10,
  analysis_score: 10,
  punctuality_score: 10,
} as const;

type CriterionKey = keyof typeof CRITERION_LIMITS;

type AiEvaluationOutput = {
  relevance_score: number;
  prompt_quality_score: number;
  ai_usage_score: number;
  practical_value_score: number;
  creativity_score: number;
  analysis_score: number;
  punctuality_score: number;
  total_score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

const SYSTEM_PROMPT =
  "Siz 'Bir haftada AI' marafoni topshiriqlarini baholovchi xolis ekspert tizimisiz. " +
  "Siz ishtirokchi yuborgan prompt, AI natijasi va izohni belgilangan mezonlar asosida 100 ballik tizimda baholaysiz. " +
  "Baholash adolatli, aniq va izohli bolishi kerak. Siz faqat JSON formatda javob qaytarasiz. " +
  "Ballar mezonlarning maksimal qiymatidan oshmasligi shart. Umumiy ball mezonlar yigindisiga teng bolishi shart. " +
  "Javob ozbek tilida bolsin.";

const JSON_SHAPE_HINT = `
JSON format:
{
  "relevance_score": number,
  "prompt_quality_score": number,
  "ai_usage_score": number,
  "practical_value_score": number,
  "creativity_score": number,
  "analysis_score": number,
  "punctuality_score": number,
  "total_score": number,
  "feedback": "Uzbek feedback text",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."]
}
`.trim();

const REQUIRED_KEYS: Array<keyof AiEvaluationOutput> = [
  "relevance_score",
  "prompt_quality_score",
  "ai_usage_score",
  "practical_value_score",
  "creativity_score",
  "analysis_score",
  "punctuality_score",
  "total_score",
  "feedback",
  "strengths",
  "weaknesses",
  "recommendations",
];

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

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 6);
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

function isValidPayload(payload: Record<string, unknown>): boolean {
  return REQUIRED_KEYS.every((key) => key in payload);
}

function calculateTimelinessScore(submittedAt: string, deadline: string | null): number {
  if (!deadline) {
    return CRITERION_LIMITS.punctuality_score;
  }

  const submittedAtMs = new Date(submittedAt).getTime();
  const deadlineMs = new Date(deadline).getTime();

  if (Number.isNaN(submittedAtMs) || Number.isNaN(deadlineMs)) {
    return CRITERION_LIMITS.punctuality_score;
  }

  return submittedAtMs <= deadlineMs ? CRITERION_LIMITS.punctuality_score : 0;
}

function computeTotalScore(scores: Omit<AiEvaluationOutput, "total_score">): number {
  return (
    scores.relevance_score +
    scores.prompt_quality_score +
    scores.ai_usage_score +
    scores.practical_value_score +
    scores.creativity_score +
    scores.analysis_score +
    scores.punctuality_score
  );
}

function normalizeEvaluation(
  payload: Record<string, unknown>,
  timelinessScore: number,
): AiEvaluationOutput {
  const normalized: Omit<AiEvaluationOutput, "total_score"> = {
    relevance_score: clampScore(payload.relevance_score, CRITERION_LIMITS.relevance_score),
    prompt_quality_score: clampScore(
      payload.prompt_quality_score,
      CRITERION_LIMITS.prompt_quality_score,
    ),
    ai_usage_score: clampScore(payload.ai_usage_score, CRITERION_LIMITS.ai_usage_score),
    practical_value_score: clampScore(
      payload.practical_value_score,
      CRITERION_LIMITS.practical_value_score,
    ),
    creativity_score: clampScore(payload.creativity_score, CRITERION_LIMITS.creativity_score),
    analysis_score: clampScore(payload.analysis_score, CRITERION_LIMITS.analysis_score),
    punctuality_score: clampScore(timelinessScore, CRITERION_LIMITS.punctuality_score),
    feedback:
      typeof payload.feedback === "string" && payload.feedback.trim().length > 0
        ? payload.feedback.trim().slice(0, 1600)
        : "Ish avtomatik baholandi. Yakuniy ball ekspert tasdigidan otadi.",
    strengths: sanitizeStringList(payload.strengths),
    weaknesses: sanitizeStringList(payload.weaknesses),
    recommendations: sanitizeStringList(payload.recommendations),
  };

  return {
    ...normalized,
    total_score: computeTotalScore(normalized),
  };
}

function buildUserPrompt(input: {
  taskTitle: string;
  taskDescription: string;
  instruction: string;
  expectedOutput: string;
  promptText: string;
  aiResult: string | null;
  resultUrl: string | null;
  fileUrl: string | null;
  participantComment: string | null;
  submittedAt: string;
  deadline: string | null;
}): string {
  return [
    `Topshiriq nomi: ${input.taskTitle}`,
    `Topshiriq tavsifi: ${input.taskDescription || "N/A"}`,
    `Kutilgan natija: ${input.expectedOutput || "N/A"}`,
    `Korsatma: ${input.instruction || "N/A"}`,
    `Participant prompt: ${input.promptText || "N/A"}`,
    `AI natijasi: ${input.aiResult || "N/A"}`,
    `Natija havolasi: ${input.resultUrl || "N/A"}`,
    `Fayl URL: ${input.fileUrl || "N/A"}`,
    `Participant izohi: ${input.participantComment || "N/A"}`,
    `Yuborilgan vaqt: ${input.submittedAt}`,
    `Deadline: ${input.deadline || "N/A"}`,
    "Baholash mezonlariga qattiq amal qiling.",
    JSON_SHAPE_HINT,
  ].join("\n");
}

async function gradeWithOpenAI(prompt: string): Promise<{ payload: Record<string, unknown>; rawText: string }> {
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
  return { payload: parseModelPayload(content), rawText: content };
}

async function gradeWithGemini(prompt: string): Promise<{ payload: Record<string, unknown>; rawText: string }> {
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

  return { payload: parseModelPayload(text), rawText: text };
}

async function requestEvaluation(
  provider: "openai" | "gemini",
  prompt: string,
): Promise<{ payload: Record<string, unknown>; rawText: string; ok: boolean }> {
  const response =
    provider === "gemini" ? await gradeWithGemini(prompt) : await gradeWithOpenAI(prompt);

  return {
    ...response,
    ok: isValidPayload(response.payload),
  };
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
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
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
    .select(
      "id, task_id, participant_id, prompt_text, ai_result, result_url, file_url, participant_comment, submitted_at",
    )
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, description, instruction, expected_output, deadline")
    .eq("id", submission.task_id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const provider =
    body?.provider ?? (process.env.AI_PROVIDER === "gemini" ? "gemini" : "openai");

  const inputPrompt = buildUserPrompt({
    taskTitle: String(task.title ?? ""),
    taskDescription: String(task.description ?? ""),
    instruction: String(task.instruction ?? ""),
    expectedOutput: String(task.expected_output ?? ""),
    promptText: String(submission.prompt_text ?? ""),
    aiResult: submission.ai_result ? String(submission.ai_result) : null,
    resultUrl: submission.result_url ? String(submission.result_url) : null,
    fileUrl: submission.file_url ? String(submission.file_url) : null,
    participantComment: submission.participant_comment
      ? String(submission.participant_comment)
      : null,
    submittedAt: String(submission.submitted_at),
    deadline: task.deadline,
  });

  let response = await requestEvaluation(provider, inputPrompt);
  if (!response.ok) {
    response = await requestEvaluation(provider, inputPrompt);
  }

  if (!response.ok) {
    const { error: upsertError } = await supabase.from("evaluations").upsert(
      {
        submission_id: submission.id,
        relevance_score: 0,
        prompt_quality_score: 0,
        ai_usage_score: 0,
        practical_value_score: 0,
        creativity_score: 0,
        analysis_score: 0,
        punctuality_score: 0,
        total_score: 0,
        ai_feedback: "AI baholashni avtomatik bajarib bolmadi. Iltimos qayta urinib koring.",
        ai_raw_response: {
          error: "Invalid JSON response",
          raw: response.rawText,
        },
        evaluated_by_ai: false,
        approved_by: null,
        approved_at: null,
      },
      { onConflict: "submission_id" },
    );

    if (upsertError) {
      return NextResponse.json(
        { error: "Failed to store failed evaluation.", details: upsertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "AI response is not valid JSON." },
      { status: 502 },
    );
  }

  const timelinessScore = calculateTimelinessScore(
    String(submission.submitted_at),
    task.deadline,
  );
  const scores = normalizeEvaluation(response.payload, timelinessScore);

  const { error: evaluationError } = await supabase.from("evaluations").upsert(
    {
      submission_id: submission.id,
      relevance_score: scores.relevance_score,
      prompt_quality_score: scores.prompt_quality_score,
      ai_usage_score: scores.ai_usage_score,
      practical_value_score: scores.practical_value_score,
      creativity_score: scores.creativity_score,
      analysis_score: scores.analysis_score,
      punctuality_score: scores.punctuality_score,
      total_score: scores.total_score,
      ai_feedback: scores.feedback,
      ai_raw_response: response.payload,
      evaluated_by_ai: true,
      approved_by: null,
      approved_at: null,
    },
    { onConflict: "submission_id" },
  );

  if (evaluationError) {
    return NextResponse.json(
      { error: "Failed to save evaluation.", details: evaluationError.message },
      { status: 500 },
    );
  }

  const { error: statusUpdateError } = await supabase
    .from("submissions")
    .update({ status: "ai_evaluated" })
    .eq("id", submission.id);

  if (statusUpdateError) {
    return NextResponse.json(
      {
        error: "Evaluation saved, but failed to update submission status.",
        details: statusUpdateError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    provider,
    evaluation: scores,
  });
}
