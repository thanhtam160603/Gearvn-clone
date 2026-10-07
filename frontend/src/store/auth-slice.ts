import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "@/lib/api/client";
import {
  loginUser,
  logoutUser,
  patchMe,
  refreshSession,
  registerUser,
} from "@/lib/api/identity";
import type { AppDispatch, RootState } from "@/lib/store";
import type { AuthErrorCode, AuthSession, AuthState, AuthUser } from "@/types/auth";

type LoginCredentials = { email: string; password: string };
type RegisterInput = LoginCredentials & { name: string };
export type UpdateProfileInput = {
  displayName: string;
  phone: string;
  birthDate: string;
};
type AuthThunk<T> = (dispatch: AppDispatch, getState: () => RootState) => T;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  status: "idle",
  error: null,
  initialized: false,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    started(state) {
      state.status = "loading";
      state.error = null;
    },
    received(state, action: PayloadAction<AuthSession>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAt = action.payload.accessTokenExpiresAt;
      state.status = "authenticated";
      state.error = null;
      state.initialized = true;
    },
    missing(state) {
      state.user = null;
      state.accessToken = null;
      state.accessTokenExpiresAt = null;
      state.status = "unauthenticated";
      state.error = null;
      state.initialized = true;
    },
    failed(state, action: PayloadAction<AuthErrorCode>) {
      state.user = null;
      state.accessToken = null;
      state.accessTokenExpiresAt = null;
      state.status = "error";
      state.error = action.payload;
      state.initialized = true;
    },
    refreshProblem(state) {
      state.error = "NETWORK_ERROR";
    },
    profileUpdated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.error = null;
    },
    profileFailed(state) {
      state.error = "PROFILE_UPDATE_FAILED";
    },
  },
});
const { started, received, missing, failed, refreshProblem, profileUpdated, profileFailed } = slice.actions;
let operationVersion = 0;
let refreshTask: Promise<boolean> | null = null;
let bootstrapTask: Promise<void> | null = null;

function errorCode(error: unknown, fallback: AuthErrorCode): AuthErrorCode {
  if (error instanceof ApiError && error.status === 0) return "NETWORK_ERROR";
  return fallback;
}

export function login(input: LoginCredentials): AuthThunk<Promise<boolean>> {
  return async (dispatch) => {
    const version = ++operationVersion;
    dispatch(started());
    try {
      const session = await loginUser(input);
      if (version !== operationVersion) return false;
      dispatch(received(session));
      return true;
    } catch (error) {
      if (version !== operationVersion) return false;
      dispatch(failed(errorCode(error, "INVALID_CREDENTIALS")));
      return false;
    }
  };
}

export function register(input: RegisterInput): AuthThunk<Promise<boolean>> {
  return async (dispatch) => {
    const version = ++operationVersion;
    dispatch(started());
    try {
      const session = await registerUser(input);
      if (version !== operationVersion) return false;
      dispatch(received(session));
      return true;
    } catch (error) {
      if (version !== operationVersion) return false;
      dispatch(failed(errorCode(error, "REGISTER_FAILED")));
      return false;
    }
  };
}

export function bootstrapSession(): AuthThunk<Promise<void>> {
  return (dispatch) => {
    if (bootstrapTask) return bootstrapTask;
    const version = ++operationVersion;
    bootstrapTask = (async () => {
      try {
        const session = await refreshSession();
        if (version === operationVersion) dispatch(received(session));
      } catch (error) {
        if (version !== operationVersion) return;
        if (error instanceof ApiError && error.status === 401) dispatch(missing());
        else dispatch(failed(errorCode(error, "REFRESH_FAILED")));
      } finally {
        bootstrapTask = null;
      }
    })();
    return bootstrapTask;
  };
}

export function refreshAccessToken(): AuthThunk<Promise<boolean>> {
  return (dispatch) => {
    if (refreshTask) return refreshTask;
    const version = ++operationVersion;
    refreshTask = (async () => {
      try {
        const session = await refreshSession();
        if (version !== operationVersion) return false;
        dispatch(received(session));
        return true;
      } catch (error) {
        if (version !== operationVersion) return false;
        if (error instanceof ApiError && error.status === 401) dispatch(missing());
        else dispatch(refreshProblem());
        return false;
      } finally {
        refreshTask = null;
      }
    })();
    return refreshTask;
  };
}

export function logout(): AuthThunk<Promise<boolean>> {
  return async (dispatch) => {
    ++operationVersion;
    dispatch(missing());
    try {
      await logoutUser();
      return true;
    } catch {
      dispatch(refreshProblem());
      return false;
    }
  };
}

export function updateProfile(input: UpdateProfileInput): AuthThunk<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().auth.accessToken) throw new Error("Phiên đăng nhập đã hết hạn.");
    try {
      const user = await patchMe({
        name: input.displayName.trim(),
        phone: input.phone.trim(),
        birthDate: input.birthDate || null,
      });
      dispatch(profileUpdated(user));
    } catch (error) {
      dispatch(profileFailed());
      throw error;
    }
  };
}

export const authReducer = slice.reducer;
