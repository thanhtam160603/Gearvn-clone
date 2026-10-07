import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "@/lib/api/client";
import { addCartItem, clearServerCart, getCart, mergeGuestCart, removeCartItem, setCartQuantity, setCartSelection } from "@/lib/api/cart";
import { parseLegacyCart, planLegacyCartTransfer } from "@/lib/cart-migration";
import type { AppDispatch, RootState } from "@/lib/store";
import type { CartState, CartView } from "@/types/cart";

const initialState: CartState = { view: null, isDrawerOpen: false, isHydrated: false, status: "idle", error: null, warning: null };
const slice = createSlice({
  name: "cart", initialState,
  reducers: {
    loading(state) { state.status = "loading"; state.error = null; },
    received(state, action: PayloadAction<CartView>) { state.view = action.payload; state.status = "ready"; state.isHydrated = true; state.error = null; },
    failed(state, action: PayloadAction<string>) { state.status = "error"; state.isHydrated = true; state.error = action.payload; },
    migrationWarning(state, action: PayloadAction<string>) { state.warning = action.payload; },
    resetCart(state) { state.view = null; state.isHydrated = false; state.status = "idle"; state.error = null; state.warning = null; },
    openDrawer(state) { state.isDrawerOpen = true; },
    closeDrawer(state) { state.isDrawerOpen = false; },
  },
});
export const { openDrawer, closeDrawer, resetCart } = slice.actions;
const { loading, received, failed, migrationWarning } = slice.actions;
export const cartReducer = slice.reducer;
const message = (error: unknown) => error instanceof ApiError ? error.message : "Không cập nhật được giỏ hàng. Vui lòng thử lại.";
type CartThunk<T> = (dispatch: AppDispatch, getState: () => RootState) => T;
const isAuthenticated = (state: RootState) => Boolean(state.auth.user && state.auth.accessToken);

export function loadCart(): CartThunk<Promise<boolean>> {
  return async (dispatch, getState) => {
    dispatch(loading());
    try { dispatch(received(await getCart(isAuthenticated(getState())))); return true; }
    catch (error) { dispatch(failed(message(error))); return false; }
  };
}

export function initializeCart(): CartThunk<Promise<boolean>> {
  return async (dispatch, getState) => {
    dispatch(loading());
    try {
      const authenticated = isAuthenticated(getState());
      let view = await getCart(authenticated);
      dispatch(received(view));
      let legacy = [] as ReturnType<typeof parseLegacyCart>;
      try { if (typeof window !== "undefined") legacy = parseLegacyCart(window.localStorage.getItem("gearvn-cart")); }
      catch { /* Browser storage may be disabled; the server cart remains available. */ }
      if (legacy.length) {
        const skipped: string[] = [];
        for (const operation of planLegacyCartTransfer(legacy, view.items)) {
          try {
            if (operation.kind === "add") await addCartItem(operation.productId, operation.quantity, authenticated);
            else await setCartQuantity(operation.productId, operation.quantity, authenticated);
          } catch (error) {
            if (error instanceof ApiError && [404, 409].includes(error.status)) skipped.push(operation.productId);
            else throw error;
          }
        }
        view = await getCart(authenticated);
        try { if (typeof window !== "undefined") window.localStorage.removeItem("gearvn-cart"); } catch { /* Ignore storage access errors. */ }
        if (skipped.length) dispatch(migrationWarning(`${skipped.length} sản phẩm trong giỏ cũ không còn có thể thêm vào giỏ hàng.`));
      }
      if (authenticated) { await mergeGuestCart(); view = await getCart(true); }
      dispatch(received(view));
      return true;
    } catch (error) { dispatch(failed(message(error))); return false; }
  };
}

async function mutate(dispatch: AppDispatch, getState: () => RootState, request: (authenticated: boolean) => Promise<void>): Promise<boolean> {
  try {
    const authenticated = isAuthenticated(getState());
    await request(authenticated);
    dispatch(received(await getCart(authenticated)));
    return true;
  } catch (error) { dispatch(failed(message(error))); return false; }
}
export function addItem({ productId }: { productId: string; stockQuantity?: number }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => mutate(dispatch, getState, (auth) => addCartItem(productId, 1, auth));
}
export function setQuantity({ productId, quantity }: { productId: string; quantity: number; stockQuantity?: number }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => mutate(dispatch, getState, (auth) => setCartQuantity(productId, quantity, auth));
}
export function increaseQuantity({ productId }: { productId: string; stockQuantity?: number }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => {
    const item = getState().cart.view?.items.find((line) => line.productId === productId);
    return item ? dispatch(setQuantity({ productId, quantity: item.quantity + 1 })) : Promise.resolve(false);
  };
}
export function decreaseQuantity({ productId }: { productId: string; stockQuantity?: number }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => {
    const item = getState().cart.view?.items.find((line) => line.productId === productId);
    return item && item.quantity > 1 ? dispatch(setQuantity({ productId, quantity: item.quantity - 1 })) : Promise.resolve(false);
  };
}
export function setSelection({ productId, selected }: { productId: string; selected: boolean }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => mutate(dispatch, getState, (auth) => setCartSelection(productId, selected, auth));
}
export function removeItem({ productId }: { productId: string }): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => mutate(dispatch, getState, (auth) => removeCartItem(productId, auth));
}
export function clearCart(): CartThunk<Promise<boolean>> {
  return (dispatch, getState) => mutate(dispatch, getState, (auth) => clearServerCart(auth));
}
