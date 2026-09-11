// Thin typed fetch wrapper per Architecture v1.1 §6.2. This is the ONLY module that attaches
// the bearer token, normalizes ProblemDetails errors, and (eventually) triggers the §7.3
// refresh-on-401 flow. Screens/hooks call the query-hook modules (§6.3, not yet built) which
// call this — never `fetch` directly.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';

// Set by AuthProvider whenever the in-memory access token changes (Architecture §7.2 — the
// access token lives in memory only, never in localStorage/sessionStorage).
let currentAccessToken: string | null = null;
export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

// Set by AuthProvider to hook the §7.3 refresh-on-401 flow in once it exists. Left as a no-op
// until F-UI-000.2's login/refresh flow is built, so a 401 today surfaces as a normal
// ApiError rather than silently retrying forever.
let onUnauthorized: (() => Promise<boolean>) | null = null;
export function setUnauthorizedHandler(handler: (() => Promise<boolean>) | null) {
  onUnauthorized = handler;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Draft picks and roster submission require this per API Consumption Specification v1.0 §5. */
  idempotencyKey?: string;
  /** Roster submission only — the ETag from the preceding GET (Architecture v1.1 §6.5). */
  ifMatch?: string;
  /** Retried once already after a 401 → refresh cycle; prevents infinite refresh loops. */
  _isRetry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: TResponse; response: Response }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (currentAccessToken) headers.Authorization = `Bearer ${currentAccessToken}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.ifMatch) headers['If-Match'] = options.ifMatch;

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options._isRetry && onUnauthorized) {
    const refreshed = await onUnauthorized();
    if (refreshed) {
      return apiRequest<TResponse>(path, { ...options, _isRetry: true });
    }
  }

  if (!response.ok) {
    let problem: ProblemDetails = { status: response.status };
    try {
      problem = await response.json();
    } catch {
      // Non-JSON error body — fall back to the bare status.
    }
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) {
    return { data: undefined as TResponse, response };
  }

  const data = (await response.json()) as TResponse;
  return { data, response };
}

/** Reads a named response header — used to capture the roster ETag (Architecture §6.5). */
export function getResponseHeader(response: Response, name: string): string | null {
  return response.headers.get(name);
}
