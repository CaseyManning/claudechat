import { z } from "zod";

export const registerFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export type NewUserData = z.infer<typeof registerFormSchema>;
