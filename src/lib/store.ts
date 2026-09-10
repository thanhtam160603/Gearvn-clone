import {configureStore} from "@reduxjs/toolkit";
import { cartReducer } from "../store/cart-slice";
import { uiReducer } from "../store/ui-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];