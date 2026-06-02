import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Guards platform-admin routes. Requires a token AND `user.is_admin`.
 * - No token → redirect to /login (preserving the target).
 * - Authenticated non-admin → redirect home (the panel is admin-only).
 */
export function AdminRoute() {
  const token = useAuthStore((s) => s.token)
  const isAdmin = useAuthStore((s) => s.user?.is_admin === true)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
