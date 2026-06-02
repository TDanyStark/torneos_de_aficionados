import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

/** Resolve whether the dark class should be applied for a given mode. */
export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return mode === 'dark'
}

/** Apply / remove the `.dark` class on <html>. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement
  root.classList.toggle('dark', resolveIsDark(mode))
}

/**
 * While the user is in `system` mode, follow the OS color-scheme live (so
 * toggling dark mode in the OS updates the app without a reload). Returns a
 * cleanup function. SSR-safe: no-op when `window`/`matchMedia` are unavailable.
 */
export function subscribeSystemTheme(getMode: () => ThemeMode): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getMode() === 'system') {
      applyTheme('system')
    }
  }
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => {
        set({ mode })
        applyTheme(mode)
      },
      toggle: () => {
        const next: ThemeMode = resolveIsDark(get().mode) ? 'light' : 'dark'
        set({ mode: next })
        applyTheme(next)
      },
    }),
    {
      name: 'torneos-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode)
      },
    },
  ),
)
