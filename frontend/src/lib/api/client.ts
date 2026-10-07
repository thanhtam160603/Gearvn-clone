import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type AuthHooks = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<boolean>;
};

let auth: AuthHooks = {
  getAccessToken: () => null,
  refreshAccessToken: async () => false,
};

export function configureApiAuth(hooks: AuthHooks): void {
  auth = hooks;
}

const baseURL = typeof window === "undefined"
  ? process.env.API_UPSTREAM_ORIGIN || process.env.NEXT_PUBLIC_API_BASE_URL
  : process.env.NODE_ENV === "production" ? undefined : process.env.NEXT_PUBLIC_API_BASE_URL;
export const apiClient = axios.create({ baseURL, withCredentials: true });
export const authClient = axios.create({ baseURL, withCredentials: true });

authClient.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
}, undefined, { synchronous: true });

function errorBody(value: unknown): { code?: string; message?: string } {
  if (typeof value !== "object" || value === null) return {};
  const body = value as Record<string, unknown>;
  const message = typeof body.message === "string"
    ? body.message
    : Array.isArray(body.message)
      ? body.message.filter((part): part is string => typeof part === "string").join("; ")
      : undefined;
  return {
    code: typeof body.code === "string" ? body.code : undefined,
    message: message || undefined,
  };
}

function normalizeError(error: unknown): Promise<never> {
  if (!isAxiosError(error)) return Promise.reject(error);
  const status = error.response?.status ?? 0;
  const body = errorBody(error.response?.data);
  return Promise.reject(new ApiError(
    status,
    body.code ?? (status === 0 ? "NETWORK_ERROR" : "HTTP_ERROR"),
    body.message ?? (status === 0
      ? "Không kết nối được máy chủ."
      : `Yêu cầu thất bại (${status}).`),
  ));
}

apiClient.interceptors.response.use(undefined, normalizeError);

type RetryConfig = InternalAxiosRequestConfig & { retried?: boolean };

authClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config) {
    const config = error.config as RetryConfig;
    if (!config.retried) {
      config.retried = true;
      const token = auth.getAccessToken();
      const sentToken = config.headers.get("Authorization");
      const restored = token && sentToken !== `Bearer ${token}`
        ? true
        : await auth.refreshAccessToken();
      if (restored) return authClient(config);
    }
  }
  return normalizeError(error);
});
