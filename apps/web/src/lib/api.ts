import { useAuthStore } from "@/stores/auth-store";
import { useSessionExpiredStore } from "@/stores/session-expired-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function handleUnauthorized(path: string) {
  // Don't show the expired-session popup for the login attempt itself.
  if (path.startsWith("/auth/login")) return;
  // Only trigger if the user previously had a session (i.e. their token expired).
  if (!useAuthStore.getState().accessToken) return;
  useSessionExpiredStore.getState().show();
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    handleUnauthorized(path);
    const error = await response.json().catch(() => ({ message: "Session expired" }));
    throw new Error(error.message ?? "Session expired");
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function downloadReport(path: string, filename: string) {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 401) {
    handleUnauthorized(path);
    throw new Error("Session expired");
  }
  if (!response.ok) throw new Error("Export failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
