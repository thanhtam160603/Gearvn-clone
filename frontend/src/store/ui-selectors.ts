import type { RootState } from "@/lib/store";

export const selectIsCategoryOverlayOpen = (state: RootState) => state.ui.isCategoryOverlayOpen;

export const selectIsLoginDialogOpen = (state: RootState) => state.ui.isLoginDialogOpen;
export const selectLoginRedirectPath = (state: RootState) => state.ui.loginRedirectPath;