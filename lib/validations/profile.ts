import { z } from "zod";

export const profileSchema = z.object({
  full_name: z
    .string({ required_error: "Tolik ism majburiy." })
    .min(2, "Tolik ism kamida 2 ta belgidan iborat bolsin."),
  phone: z.string().optional(),
  organization: z.string().optional(),
  region: z.string().optional(),
  avatar_url: z.string().url("Avatar URL notogri formatda.").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
