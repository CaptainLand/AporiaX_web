const DEFAULT_API_URL = "https://captainlan.tail0f652a.ts.net";
const API_URL = (import.meta.env.VITE_APORIA_API_URL || DEFAULT_API_URL).replace(
  /\/$/,
  "",
);

let accessToken = null;
let refreshPromise = null;
const RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const NETWORK_RETRY_DELAY_MS = 280;
const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getApiUrl() {
  return API_URL;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function rawRequest(path, options = {}, attempt = 0) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && options.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const method = String(options.method || "GET").toUpperCase();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers,
      body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
    });
  } catch (error) {
    if (attempt === 0 && RETRYABLE_METHODS.has(method)) {
      await sleep(NETWORK_RETRY_DELAY_MS);
      return rawRequest(path, options, attempt + 1);
    }
    throw new ApiError("NETWORK_UNAVAILABLE", 0, {
      path,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
  const payload = await parseResponse(response);
  return { response, payload };
}

export async function refreshWebSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { response, payload } = await rawRequest("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {},
      });
      if (!response.ok || !payload?.accessToken) {
        setAccessToken(null);
        throw new ApiError(payload?.error || "SESSION_REFRESH_FAILED", response.status, payload);
      }
      setAccessToken(payload.accessToken);
      return payload;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function api(path, options = {}, retry = true) {
  const { response, payload } = await rawRequest(path, options);
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    try {
      await refreshWebSession();
      return api(path, options, false);
    } catch {
      // Fall through with the original unauthorized response.
    }
  }
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error || payload?.message || `HTTP_${response.status}`;
    throw new ApiError(String(message), response.status, payload);
  }
  return payload;
}

export async function requestEmailCode(email, inviteCode = "") {
  return api("/auth/email/request-code", {
    method: "POST",
    body: { email, ...(inviteCode ? { inviteCode } : {}) },
  }, false);
}

export async function verifyEmailCode(email, code, inviteCode = "") {
  const result = await api("/auth/email/verify", {
    method: "POST",
    body: { email, code, clientType: "web", ...(inviteCode ? { inviteCode } : {}) },
  }, false);
  setAccessToken(result.accessToken);
  return result;
}

export async function authorizeDesktopLogin(request) {
  const options = { method: "POST", body: request };
  try {
    return await api("/auth/desktop/authorize", options, false);
  } catch (error) {
    if (error?.status !== 401) throw error;
    await refreshWebSession();
    return api("/auth/desktop/authorize", options, false);
  }
}

export async function logoutWebSession() {
  try {
    await api("/auth/logout", { method: "POST" }, false);
  } finally {
    setAccessToken(null);
  }
}
