import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(72, "Mật khẩu không được vượt quá 72 ký tự."),
});