import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Minimal snapshot of a followed tournament, persisted in localStorage. This
 * powers "Torneos que sigo" for visitors/players who follow a tournament from
 * its public link WITHOUT logging in. Organizer/delegate tournaments come from
 * the backend (GET /me/tournaments) and are merged in the page.
 */
export interface FollowedSnapshot {
  id: number
  slug: string
  name: string
  logo_url: string | null
  /** Epoch ms when the user started following — used to sort newest first. */
  followed_at: number
}

interface FollowState {
  followed: FollowedSnapshot[]
  isFollowing: (id: number) => boolean
  follow: (snapshot: Omit<FollowedSnapshot, 'followed_at'>) => void
  unfollow: (id: number) => void
  toggle: (snapshot: Omit<FollowedSnapshot, 'followed_at'>) => void
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      followed: [],
      isFollowing: (id) => get().followed.some((t) => t.id === id),
      follow: (snapshot) => {
        if (get().followed.some((t) => t.id === snapshot.id)) return
        set((state) => ({
          followed: [
            { ...snapshot, followed_at: Date.now() },
            ...state.followed,
          ],
        }))
      },
      unfollow: (id) =>
        set((state) => ({
          followed: state.followed.filter((t) => t.id !== id),
        })),
      toggle: (snapshot) => {
        if (get().isFollowing(snapshot.id)) {
          get().unfollow(snapshot.id)
        } else {
          get().follow(snapshot)
        }
      },
    }),
    { name: 'torneos-followed' },
  ),
)
