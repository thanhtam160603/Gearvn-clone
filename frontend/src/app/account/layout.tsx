import { Suspense, type ReactNode } from "react";

import AccountShell from "@/components/account/AccountShell";
import AuthGate from "@/components/auth/AuthGate";
import AppFooter from "@/components/common/AppFooter";
import AppHeader from "@/components/common/AppHeader";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-[var(--background)]">
        <Suspense
          fallback={
            <div className="flex min-h-48 items-center justify-center text-sm text-neutral-500">
              Đang kiểm tra phiên đăng nhập...
            </div>
          }
        >
          <AuthGate>
            <AccountShell>{children}</AccountShell>
          </AuthGate>
        </Suspense>
      </main>
      <AppFooter />
    </>
  );
}
