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

function createDraft(
  user: { displayName: string; phone: string; birthDate: string } | null,
): ProfileDraft {
  return {
    displayName: user?.displayName ?? "",
    phone: user?.phone ?? "",
    birthDate: user?.birthDate ?? "",
  };
}

const inputClassName =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[var(--gearvn-red)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export default function AccountProfileForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => createDraft(user));
  const [saveError, setSaveError] = useState("");

  if (!user) return null;

  function startEditing() {
    setSaveError("");
    setDraft(createDraft(user));
    setEditing(true);
  }

  function cancelEditing() {
    setSaveError("");
    setDraft(createDraft(user));
    setEditing(false);
  }

  function updateDraft(field: keyof ProfileDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await dispatch(updateProfile(draft));
      setSaveError("");
      setEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được thông tin cá nhân. Vui lòng thử lại.");
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

      {saveError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-800">
            Họ và tên
            <input
              type="text"
              value={draft.displayName}
              disabled={!editing}
              required
              onChange={(event) =>
                updateDraft("displayName", event.target.value)
              }
              className={`${inputClassName} mt-2`}
            />
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
              className={`${inputClassName} mt-2`}
            />
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
              className={`${inputClassName} mt-2`}
            />
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
