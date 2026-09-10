import type { RootState } from "@/lib/store";

export const selectIsCategoryOverlayOpen = (state: RootState) => state.ui.isCategoryOverlayOpen;