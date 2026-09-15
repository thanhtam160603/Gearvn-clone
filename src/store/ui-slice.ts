import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  isCategoryOverlayOpen: boolean;

  isLoginDialogOpen: boolean;
  loginRedirectPath: string;
};

const initialState: UiState = {
  isCategoryOverlayOpen: false,

  isLoginDialogOpen: false,
  loginRedirectPath: "/",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
    reducers: {
        openCategoryOverlay(state) {
            state.isCategoryOverlayOpen = true;
        },
        closeCategoryOverlay(state) {
            state.isCategoryOverlayOpen = false;
        },
        toggleCategoryOverlay(state) {
            state.isCategoryOverlayOpen = !state.isCategoryOverlayOpen;
        },
        openLoginDialog(state, action: PayloadAction<string>) {
            state.isLoginDialogOpen = true;
            state.loginRedirectPath = action.payload;
        },
        closeLoginDialog(state) {
            state.isLoginDialogOpen = false;
            state.loginRedirectPath = "/";
        },
    },
});

export const { openCategoryOverlay, closeCategoryOverlay, toggleCategoryOverlay, openLoginDialog, closeLoginDialog } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
