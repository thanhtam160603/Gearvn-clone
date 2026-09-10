import {createSlice} from "@reduxjs/toolkit";

type UiState = {
  isCategoryOverlayOpen: boolean;
};

const initialState: UiState = {
  isCategoryOverlayOpen: false,
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
        }
    },
});

export const { openCategoryOverlay, closeCategoryOverlay, toggleCategoryOverlay } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
