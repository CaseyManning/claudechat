import z from "zod/v3";

export const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  redirectTo: z.string().optional(),
});

export type UserLoginData = z.infer<typeof loginFormSchema>;
