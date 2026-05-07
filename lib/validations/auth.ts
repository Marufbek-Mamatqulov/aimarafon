import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email majburiy." })
    .email("Email formati notogri."),
  password: z
    .string({ required_error: "Parol majburiy." })
    .min(6, "Parol kamida 6 ta belgidan iborat bolsin."),
});

export const registerSchema = z.object({
  full_name: z
    .string({ required_error: "Tolik ism majburiy." })
    .min(2, "Tolik ism kamida 2 ta belgidan iborat bolsin."),
  phone: z.string().optional(),
  email: z
    .string({ required_error: "Email majburiy." })
    .email("Email formati notogri."),
  password: z
    .string({ required_error: "Parol majburiy." })
    .min(6, "Parol kamida 6 ta belgidan iborat bolsin."),
  organization: z.string().optional(),
  region: z.string().optional(),
  rules_accepted: z.literal(true, {
    errorMap: () => ({ message: "Qoidalarni qabul qilishingiz kerak." }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
