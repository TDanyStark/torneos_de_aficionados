import { useMe } from '@/features/auth/api/useAuth'

/**
 * Side-effect-only component: when a persisted token exists, refetches /me on
 * app load so the current user + per-tournament roles stay in sync. Renders
 * nothing.
 */
export function AuthBootstrap() {
  useMe()
  return null
}
