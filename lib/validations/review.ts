import { z } from "zod";

export const reviewSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  comment: z.string().min(5, "Izoh kamida 5 ta belgidan iborat bolsin."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
