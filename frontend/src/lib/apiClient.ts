import { useAuthStore } from '@/stores/authStore'
import type {
  ApiErrorBody,
  ApiFieldErrors,
  ApiPaginated,
  ApiSuccess,
  Paginated,
} from './apiTypes'

/**
 * Base path. The Vite dev server proxies `/api` → backend (see vite.config.ts),
 * so a relative base works in both dev and production (same-origin deploy).
 */
const API_BASE = '/api/v1'

/**
 * Typed error thrown by the api client. Carries the backend message, optional
 * field-level errors (for RHF setError mapping) and the HTTP status.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: ApiFieldErrors

  constructor(message: string, status: number, fieldErrors?: ApiFieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
  /** Skip attaching the Authorization header (e.g. login). */
  anonymous?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.pathname + url.search
}

/** Core request. Resolves the parsed JSON body or throws an {@link ApiError}. */
async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', body, query, anonymous, signal } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (!anonymous) {
    const token = useAuthStore.getState().token
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  // 204 No Content
  if (response.status === 204) {
    return undefined as TResponse
  }

  let payload: unknown
  const text = await response.text()
  try {
    payload = text ? JSON.parse(text) : undefined
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    // Auto-logout on 401 so the UI can redirect to login.
    if (response.status === 401) {
      useAuthStore.getState().clear()
    }
    const errorBody = payload as ApiErrorBody | undefined
    throw new ApiError(
      errorBody?.message ?? `Request failed (${response.status})`,
      response.status,
      errorBody?.errors,
    )
  }

  return payload as TResponse
}

/** Unwraps a non-paginated `{ success, data }` envelope. */
async function unwrap<T>(path: string, options?: RequestOptions): Promise<T> {
  const res = await request<ApiSuccess<T>>(path, options)
  return res.data
}

/** Unwraps a paginated `{ success, data, meta.pagination }` envelope. */
async function unwrapPaginated<T>(
  path: string,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  const res = await request<ApiPaginated<T>>(path, options)
  return { items: res.data, pagination: res.meta.pagination }
}

export const apiClient = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    unwrap<T>(path, { method: 'GET', query, signal }),

  getPaginated: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    unwrapPaginated<T>(path, { method: 'GET', query, signal }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    unwrap<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    unwrap<T>(path, { method: 'PUT', body }),

  delete: <T = void>(path: string) => unwrap<T>(path, { method: 'DELETE' }),

  /** Raw request escape hatch (e.g. anonymous login). */
  request,
}
