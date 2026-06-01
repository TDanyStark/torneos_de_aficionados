import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/apiClient'
import type { ApiSuccess } from '@/lib/apiTypes'
import { useAuthStore } from '@/stores/authStore'
import type { LoginPayload, LoginResponse, MeResponse } from '../types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * Login mutation. On success it stores the token, then the caller refetches
 * /me to populate user + per-tournament roles.
 *
 * NOTE: payload shape (email + password) and response ({ token, user }) are
 * assumptions based on the Fase 1 contract; adjust if the backend differs.
 */
export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient.request<ApiSuccess<LoginResponse>>('/login', {
        method: 'POST',
        body: payload,
        anonymous: true,
      })
      return res.data
    },
    onSuccess: (data) => {
      setToken(data.token)
    },
  })
}

/** Fetches the current user + roles. Enabled only when a token exists. */
export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  return useQuery({
    queryKey: authKeys.me,
    enabled: Boolean(token),
    queryFn: async () => {
      try {
        const me = await apiClient.get<MeResponse>('/me')
        setSession(me.user, me.roles ?? [])
        return me
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clear()
        throw error
      }
    },
  })
}
