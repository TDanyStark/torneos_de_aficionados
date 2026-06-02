import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { LiveMatch } from '../types'

/** Query-key factory for every live-match / stats query of this feature. */
export const liveKeys = {
  all: ['live'] as const,
  match: (matchId: number) => ['live', 'match', matchId] as const,
  topScorers: (tournamentId: number, page: number) =>
    ['live', 'top-scorers', tournamentId, page] as const,
  cards: (tournamentId: number, page: number) =>
    ['live', 'cards', tournamentId, page] as const,
}

/** Auto-poll interval (ms) while a match is in progress. */
export const LIVE_POLL_INTERVAL_MS = 60_000

/**
 * Public live snapshot of a match — GET /matches/{id}/live.
 *
 * This is the FIRST use of `refetchInterval` in the app. To protect the shared
 * hosting we only poll while the match is actually in progress: `refetchInterval`
 * is a function that inspects the latest query data and returns 60s for
 * `live`/`paused`, or `false` (no polling) for every other status. Polling also
 * pauses when the tab is backgrounded (`refetchIntervalInBackground` left off).
 */
export function useLiveMatch(
  matchId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: liveKeys.match(matchId ?? 0),
    enabled: enabled && Boolean(matchId) && Number(matchId) > 0,
    queryFn: ({ signal }) =>
      apiClient.get<LiveMatch>(
        `/matches/${matchId}/live`,
        undefined,
        signal,
      ),
    refetchInterval: (query) => {
      const status = query.state.data?.match.status
      return status === 'live' || status === 'paused'
        ? LIVE_POLL_INTERVAL_MS
        : false
    },
  })
}
