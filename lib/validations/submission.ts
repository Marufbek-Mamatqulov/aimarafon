import { z } from "zod";

export const submissionSchema = z.object({
  prompt_text: z
    .string({ required_error: "Prompt matni majburiy." })
    .min(10, "Prompt kamida 10 ta belgidan iborat bolsin."),
  ai_result: z.string().optional(),
  result_url: z
    .string()
    .url("Natija havolasi notogri formatda.")
    .optional()
    .or(z.literal("")),
  participant_comment: z.string().optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
