"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import LoginForm from "@/components/auth/LoginForm";

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginDialog({ open, onClose, onSuccess }: LoginDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[80]">
      <div
        className="fixed inset-0 bg-black/55"
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-[500px] rounded-xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <DialogTitle className="text-xl font-bold uppercase text-neutral-900">
                  Đăng nhập
                </DialogTitle>
                <p className="mt-1 text-sm text-neutral-500">
                  Đăng nhập để sử dụng tài khoản GearVN.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại đăng nhập"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>

            <LoginForm
              onSuccess={onSuccess}
            />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
