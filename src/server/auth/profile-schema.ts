import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Vui lòng nhập họ và tên."),
  phone: z.string().trim().refine(
    (value) => value === "" || /^0\d{9}$/.test(value),
    "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.",
  ),
  birthDate: z.string().refine((value) => {
    if (value === "") return true;
    if (!datePattern.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      date <= today
    );
  }, "Ngày sinh không hợp lệ."),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;