import { z } from "zod";

export const taskSchema = z.object({
  day_number: z.coerce
    .number({ required_error: "Kun raqami majburiy." })
    .int()
    .min(1, "Kun 1 dan katta bolishi kerak.")
    .max(7, "Kun 7 dan kichik bolishi kerak."),
  title: z.string({ required_error: "Sarlavha majburiy." }).min(3),
  description: z.string({ required_error: "Tavsif majburiy." }).min(5),
  instruction: z.string().optional(),
  expected_output: z.string().optional(),
  deadline: z.string().optional(),
  max_score: z.coerce.number().int().min(1).max(100),
  is_published: z.boolean().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
