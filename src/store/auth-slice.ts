import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { clearSession, readSession, writeSession } from "@/lib/auth-storage";
import {
  getAuthErrorCode,
  mockAuthService,
} from "@/lib/mock-auth-service";
import type { AppDispatch, RootState } from "@/lib/store";
import type {
  AuthErrorCode,
  AuthSession,
  AuthState,
} from "@/types/auth";

type LoginCredentials = {
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  displayName: string;
  phone: string;
  birthDate: string;
};

type AuthThunk<ReturnValue> = (
  dispatch: AppDispatch,
  getState: () => RootState,
) => ReturnValue;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  status: "idle",
  error: null,
  initialized: false,
};

function applySession(state: AuthState, session: AuthSession): void {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
  state.accessTokenExpiresAt = session.accessTokenExpiresAt;
  state.refreshTokenExpiresAt = session.refreshTokenExpiresAt;
  state.status = "authenticated";
  state.error = null;
  state.initialized = true;
}

function clearAuthState(state: AuthState): void {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.accessTokenExpiresAt = null;
  state.refreshTokenExpiresAt = null;
  state.status = "unauthenticated";
  state.error = null;
  state.initialized = true;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStarted(state) {
      state.status = "loading";
      state.error = null;
    },
    loginSucceeded(state, action: PayloadAction<AuthSession>) {
      applySession(state, action.payload);
    },
    loginFailed(state, action: PayloadAction<AuthErrorCode>) {
      clearAuthState(state);
      state.status = "error";
      state.error = action.payload;
    },
    sessionRestored(state, action: PayloadAction<AuthSession | null>) {
      if (action.payload) {
        applySession(state, action.payload);
      } else {
        clearAuthState(state);
      }
    },
    sessionRestoreFailed(state, action: PayloadAction<AuthErrorCode>) {
      clearAuthState(state);
      state.error = action.payload;
    },
    refreshStarted(state) {
      state.error = null;
    },
    refreshSucceeded(state, action: PayloadAction<AuthSession>) {
      applySession(state, action.payload);
    },
    refreshFailed(state, action: PayloadAction<AuthErrorCode>) {
      clearAuthState(state);
      state.error = action.payload;
    },
    logoutStarted(state) {
      state.status = "loading";
      state.error = null;
    },
    loggedOut(state) {
      clearAuthState(state);
    },
    profileUpdated(state, action: PayloadAction<UpdateProfileInput>) {
      if (!state.user) return;

      state.user.displayName = action.payload.displayName;
      state.user.phone = action.payload.phone;
      state.user.birthDate = action.payload.birthDate;
    },
  },
});

const {
  loginStarted,
  loginSucceeded,
  loginFailed,
  sessionRestored,
  sessionRestoreFailed,
  refreshStarted,
  refreshSucceeded,
  refreshFailed,
  logoutStarted,
  loggedOut,
  profileUpdated,
} = authSlice.actions;

let authOperationVersion = 0;
let refreshTask: Promise<boolean> | null = null;

export function login(
  credentials: LoginCredentials,
): AuthThunk<Promise<boolean>> {
  return async (dispatch) => {
    const operationVersion = ++authOperationVersion;
    dispatch(loginStarted());

    try {
      const session = await mockAuthService.login(
        credentials.email,
        credentials.password,
      );

      if (operationVersion !== authOperationVersion) return false;

      writeSession(session);
      dispatch(loginSucceeded(session));
      return true;
    } catch (error) {
      if (operationVersion !== authOperationVersion) return false;

      dispatch(loginFailed(getAuthErrorCode(error)));
      return false;
    }
  };
}

export function bootstrapSession(): AuthThunk<Promise<void>> {
  return async (dispatch) => {
    const operationVersion = ++authOperationVersion;
    const session = readSession();

    if (!session) {
      dispatch(sessionRestored(null));
      return;
    }

    const restoredSession = mockAuthService.restoreSession(session);

    if (session.refreshTokenExpiresAt <= Date.now() || !restoredSession) {
      clearSession();
      dispatch(sessionRestoreFailed("SESSION_EXPIRED"));
      return;
    }

    if (restoredSession.accessTokenExpiresAt > Date.now()) {
      writeSession(restoredSession);
      dispatch(sessionRestored(restoredSession));
      return;
    }

    try {
      const refreshedSession = await mockAuthService.refresh(
        restoredSession.refreshToken,
      );

      if (operationVersion !== authOperationVersion) return;

      writeSession(refreshedSession);
      dispatch(sessionRestored(refreshedSession));
    } catch {
      if (operationVersion !== authOperationVersion) return;

      clearSession();
      dispatch(sessionRestoreFailed("SESSION_EXPIRED"));
    }
  };
}

export function refreshAccessToken(): AuthThunk<Promise<boolean>> {
  return (dispatch, getState) => {
    if (refreshTask) return refreshTask;

    const { refreshToken } = getState().auth;
    if (!refreshToken) return Promise.resolve(false);

    const operationVersion = ++authOperationVersion;
    dispatch(refreshStarted());

    refreshTask = (async () => {
      try {
        const session = await mockAuthService.refresh(refreshToken);

        if (operationVersion !== authOperationVersion) return false;

        writeSession(session);
        dispatch(refreshSucceeded(session));
        return true;
      } catch (error) {
        if (operationVersion !== authOperationVersion) return false;

        clearSession();
        dispatch(refreshFailed(getAuthErrorCode(error)));
        return false;
      } finally {
        refreshTask = null;
      }
    })();

    return refreshTask;
  };
}

export function logout(): AuthThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const refreshToken = getState().auth.refreshToken;

    ++authOperationVersion;
    dispatch(logoutStarted());
    clearSession();

    try {
      if (refreshToken) {
        await mockAuthService.logout(refreshToken);
      }
    } finally {
      dispatch(loggedOut());
    }
  };
}

export function updateProfile(
  input: UpdateProfileInput,
): AuthThunk<boolean> {
  return (dispatch, getState) => {
    const normalizedInput = {
      displayName: input.displayName.trim(),
      phone: input.phone.trim(),
      birthDate: input.birthDate,
    };

    if (!normalizedInput.displayName) return false;

    const auth = getState().auth;
    if (
      !auth.user ||
      !auth.accessToken ||
      !auth.refreshToken ||
      auth.accessTokenExpiresAt === null ||
      auth.refreshTokenExpiresAt === null
    ) {
      return false;
    }

    const updatedUser = {
      ...auth.user,
      ...normalizedInput,
    };

    dispatch(profileUpdated(normalizedInput));

    writeSession({
      user: updatedUser,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accessTokenExpiresAt: auth.accessTokenExpiresAt,
      refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
    });

    return true;
  };
}

export const authReducer = authSlice.reducer;
