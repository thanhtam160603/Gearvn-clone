"use client";

import { useRouter } from "next/navigation";

import LoginDialog from "@/components/auth/LoginDialog";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectIsLoginDialogOpen, selectLoginRedirectPath } from "@/store/ui-selectors";
import { closeLoginDialog } from "@/store/ui-slice";

export default function GlobalLoginDialog() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const loginDialogOpen = useAppSelector(selectIsLoginDialogOpen);
    const loginRedirectPath = useAppSelector(selectLoginRedirectPath);

    function handleClose() {
        dispatch(closeLoginDialog());
    }

    function handleSuccess() {
        dispatch(closeLoginDialog());
        router.replace(loginRedirectPath);
    }

    return (
        <LoginDialog
            open={loginDialogOpen}
            onClose={handleClose}
            onSuccess={handleSuccess}
        />
    );
}
