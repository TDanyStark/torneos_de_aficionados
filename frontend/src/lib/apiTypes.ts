/**
 * Shared API envelope types matching the Slim backend response contract.
 */

/** Successful, non-paginated response. */
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Successful, paginated response. */
export interface ApiPaginated<T> {
  success: true
  data: T[]
  meta: {
    pagination: PaginationMeta
  }
}

/** Field-level validation errors keyed by field name. */
export type ApiFieldErrors = Record<string, string>

/** Error envelope. */
export interface ApiErrorBody {
  success: false
  message: string
  errors?: ApiFieldErrors
}

/** Convenience client-side wrapper around a paginated result. */
export interface Paginated<T> {
  items: T[]
  pagination: PaginationMeta
}
