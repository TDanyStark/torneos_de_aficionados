import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Whitelisted tab ids for the public tournament hub (`/t/:slug`). */
export const TOURNAMENT_TABS = [
  'resumen',
  'fixtures',
  'tabla',
  'equipos',
  'goleadores',
  'disciplina',
] as const

export type TournamentTab = (typeof TOURNAMENT_TABS)[number]

const DEFAULT_TAB: TournamentTab = 'resumen'

function parseTab(value: string | null): TournamentTab {
  if (value && (TOURNAMENT_TABS as readonly string[]).includes(value)) {
    return value as TournamentTab
  }
  return DEFAULT_TAB
}

/**
 * Reads/writes the `?tab=` URL param for the tournament hub against a fixed
 * whitelist (default `resumen`). Mirrors the project's useSearchParams
 * convention but uses a PUSH (`replace:false`) on tab changes so the browser
 * back button returns to the previously viewed tab (acceptance criterion 2).
 *
 * Per-tab filter params (group/round/page/q) are intentionally left untouched
 * when switching tabs — only the `tab` key is patched.
 */
export function useTournamentTabs() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = useMemo(
    () => parseTab(searchParams.get('tab')),
    [searchParams],
  )

  const setTab = useCallback(
    (next: TournamentTab) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === DEFAULT_TAB) params.delete('tab')
          else params.set('tab', next)
          return params
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  return { tab, setTab }
}
