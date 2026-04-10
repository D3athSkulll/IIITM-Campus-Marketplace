const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const TIMEOUT_MS = 15000; // 15 second timeout

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  retries?: number;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, token, retries = 2 } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000)); // Exponential backoff
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError || new Error("Request failed");
}
