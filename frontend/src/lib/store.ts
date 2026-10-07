import {configureStore} from "@reduxjs/toolkit";
import { cartReducer } from "../store/cart-slice";
import { uiReducer } from "../store/ui-slice";
import { authReducer, refreshAccessToken } from "../store/auth-slice";
import { configureApiAuth } from "./api/client";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
      auth: authReducer,
    },
  });
  configureApiAuth({
    getAccessToken: () => store.getState().auth.accessToken,
    refreshAccessToken: () => store.dispatch(refreshAccessToken()),
  });
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
