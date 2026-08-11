const API_URL = (import.meta.env.VITE_APORIA_API_URL || "http://localhost:4100").replace(/\/$/, "");

let accessToken = null;
let refreshPromise = null;

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

async function rawRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && options.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
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

export async function requestEmailCode(email) {
  return api("/auth/email/request-code", { method: "POST", body: { email } }, false);
}

export async function verifyEmailCode(email, code) {
  const result = await api("/auth/email/verify", {
    method: "POST",
    body: { email, code, clientType: "web" },
  }, false);
  setAccessToken(result.accessToken);
  return result;
}

export async function logoutWebSession() {
  try {
    await api("/auth/logout", { method: "POST" }, false);
  } finally {
    setAccessToken(null);
  }
}
