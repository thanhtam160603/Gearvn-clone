import type { ReactNode } from "react";

import AccountBreadcrumb from "@/components/account/AccountBreadcrumb";
import AccountSidebar from "@/components/account/AccountSidebar";

type AccountShellProps = {
  children: ReactNode;
};

export default function AccountShell({ children }: AccountShellProps) {
  return (
    <div className="container-shell py-5">
      <AccountBreadcrumb />
      <div className="mt-5 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
