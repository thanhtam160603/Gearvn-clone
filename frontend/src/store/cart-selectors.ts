import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
export const selectCartItems = (state: RootState) => state.cart.view?.items ?? [];
export const selectCartHydrated = (state: RootState) => state.cart.isHydrated;
export const selectCartDrawerOpen = (state: RootState) => state.cart.isDrawerOpen;
export const selectDetailedCartItems = selectCartItems;
export const selectCartTotalQuantity = createSelector([selectCartItems], (items) => items.reduce((total, item) => total + item.quantity, 0));
export const selectCartSubtotal = (state: RootState) => state.cart.view?.subtotal ?? 0;
export const selectSelectedCartSubtotal = (state: RootState) => state.cart.view?.selectedSubtotal ?? 0;
