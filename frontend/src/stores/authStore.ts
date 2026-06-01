import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AuthUser,
  TournamentRoleName,
  UserTournamentRole,
} from '@/features/auth/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  /** Per-tournament roles for the current user (from /me). */
  roles: UserTournamentRole[]
  setToken: (token: string) => void
  setSession: (user: AuthUser, roles: UserTournamentRole[]) => void
  clear: () => void
  /** Convenience selectors. */
  isAuthenticated: () => boolean
  hasRoleInTournament: (
    tournamentId: number,
    role: TournamentRoleName,
  ) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      setToken: (token) => set({ token }),
      setSession: (user, roles) => set({ user, roles }),
      clear: () => set({ token: null, user: null, roles: [] }),
      isAuthenticated: () => Boolean(get().token),
      hasRoleInTournament: (tournamentId, role) =>
        get().roles.some(
          (r) => r.tournament_id === tournamentId && r.role === role,
        ),
    }),
    {
      name: 'torneos-auth',
      // Persist token + user + roles; selectors/methods are recreated.
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
      }),
    },
  ),
)
