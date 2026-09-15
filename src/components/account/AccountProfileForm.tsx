"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectAuthUser } from "@/store/auth-selectors";
import { updateProfile } from "@/store/auth-slice";

type ProfileDraft = {
  displayName: string;
  phone: string;
  birthDate: string;
};

type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

const phonePattern = /^0\d{9}$/;

function createDraft(
  user: { displayName: string; phone: string; birthDate: string } | null,
): ProfileDraft {
  return {
    displayName: user?.displayName ?? "",
    phone: user?.phone ?? "",
    birthDate: user?.birthDate ?? "",
  };
}

function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  const displayName = draft.displayName.trim();
  const phone = draft.phone.trim();

  if (!displayName) {
    errors.displayName = "Vui lòng nhập họ và tên.";
  }

  if (phone && !phonePattern.test(phone)) {
    errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.";
  }

  if (draft.birthDate) {
    const birthDate = new Date(`${draft.birthDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      errors.birthDate = "Ngày sinh không được lớn hơn ngày hiện tại.";
    }
  }

  return errors;
}

const inputClassName =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[var(--gearvn-red)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export default function AccountProfileForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => createDraft(user));
  const [errors, setErrors] = useState<ProfileErrors>({});

  if (!user) return null;

  function startEditing() {
    setDraft(createDraft(user));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(createDraft(user));
    setErrors({});
    setEditing(false);
  }

  function updateDraft(field: keyof ProfileDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProfile(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const updated = dispatch(updateProfile(draft));
    if (updated) {
      setEditing(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-neutral-900">
          Thông tin cá nhân
        </h1>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[var(--gearvn-red)] hover:underline"
          >
            <PencilSquareIcon className="size-4" />
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-800">
            Họ và tên
            <input
              type="text"
              value={draft.displayName}
              disabled={!editing}
              onChange={(event) =>
                updateDraft("displayName", event.target.value)
              }
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={
                errors.displayName ? "profile-display-name-error" : undefined
              }
              className={`${inputClassName} mt-2`}
            />
            {errors.displayName && (
              <span
                id="profile-display-name-error"
                className="mt-1 block text-xs font-normal text-red-600"
              >
                {errors.displayName}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            Số điện thoại
            <input
              type="tel"
              inputMode="numeric"
              value={draft.phone}
              disabled={!editing}
              onChange={(event) => updateDraft("phone", event.target.value)}
              placeholder="Nhập số điện thoại"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "profile-phone-error" : undefined}
              className={`${inputClassName} mt-2`}
            />
            {errors.phone && (
              <span
                id="profile-phone-error"
                className="mt-1 block text-xs font-normal text-red-600"
              >
                {errors.phone}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            Email
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputClassName} mt-2`}
            />
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            Ngày sinh
            <input
              type="date"
              value={draft.birthDate}
              disabled={!editing}
              onChange={(event) =>
                updateDraft("birthDate", event.target.value)
              }
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={
                errors.birthDate ? "profile-birth-date-error" : undefined
              }
              className={`${inputClassName} mt-2`}
            />
            {errors.birthDate && (
              <span
                id="profile-birth-date-error"
                className="mt-1 block text-xs font-normal text-red-600"
              >
                {errors.birthDate}
              </span>
            )}
          </label>
        </div>

        {editing && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEditing}
              className="h-10 cursor-pointer rounded-lg border border-neutral-300 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-10 cursor-pointer rounded-lg bg-[var(--gearvn-red)] px-6 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Cập nhật
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
