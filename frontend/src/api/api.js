const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const TOKEN_KEY = "movexa_access_token";
const UNAUTHORIZED_EVENT = "movexa:unauthorized";

export function getStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
    return null;
  }
}

export function storeToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("The server did not return a valid access token.");
  }

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error(
      "Movexa could not save your login session in this browser. Check your browser storage settings and try again."
    );
  }
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Continue clearing in-memory authentication even if storage is blocked.
  }
}

function notifyUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }
}

function isAuthenticationRequest(path) {
  return (
    path === "/api/auth/login" ||
    path === "/api/auth/register/patient" ||
    path === "/api/auth/register/physiotherapist"
  );
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to Movexa server. Check whether the backend is running."
    );
  }

  if (response.status === 401 && token && !isAuthenticationRequest(path)) {
    notifyUnauthorized();
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data;

  try {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? data.detail || data.message
        : data;

    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || "Invalid input").join(", ")
      : detail || `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}
