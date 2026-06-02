import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { LiveMatch, MatchEvent, RecordEventPayload } from '../types'
import { liveKeys } from './useLiveMatch'

/**
 * Optimistically fold a single event into a live snapshot's `score`. The server
 * is authoritative (own_goal credits the OPPONENT), so this is only a best-effort
 * preview reconciled by the onSettled refetch. `delta` is +1 (add) or -1 (remove).
 */
function applyScoreDelta(
  snapshot: LiveMatch,
  event: Pick<MatchEvent, 'type' | 'team_id'>,
  delta: number,
): LiveMatch {
  if (event.type !== 'goal' && event.type !== 'own_goal') return snapshot
  const { home_team_id, away_team_id } = snapshot.match
  // goal -> scoring team's side; own_goal -> opponent's side.
  let scoringSide: 'home' | 'away' | null = null
  if (event.team_id === home_team_id) {
    scoringSide = event.type === 'own_goal' ? 'away' : 'home'
  } else if (event.team_id === away_team_id) {
    scoringSide = event.type === 'own_goal' ? 'home' : 'away'
  }
  if (!scoringSide) return snapshot
  const next = { ...snapshot.score }
  next[scoringSide] = Math.max(0, next[scoringSide] + delta)
  return { ...snapshot, score: next }
}

interface EventContext {
  previous: LiveMatch | undefined
}

/**
 * Referee: record a goal/card — POST /matches/{id}/events (201).
 *
 * OPTIMISTIC: appends a temporary event (negative id) and folds the score in
 * onMutate; rolls the whole snapshot back on error; always refetches /live in
 * onSettled so the server-derived score/order reconcile (own_goal → opponent).
 */
export function useRecordEvent(matchId: number) {
  const qc = useQueryClient()
  const key = liveKeys.match(matchId)

  return useMutation({
    mutationFn: (payload: RecordEventPayload) =>
      apiClient.post<MatchEvent>(`/matches/${matchId}/events`, payload),

    onMutate: async (payload): Promise<EventContext> => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<LiveMatch>(key)
      if (previous) {
        const optimistic: MatchEvent = {
          id: -Date.now(), // temp negative id; replaced on refetch
          match_id: matchId,
          match_period_id: previous.active_period?.id ?? null,
          type: payload.type,
          team_id: payload.team_id,
          team_name: null, // names resolved by server on refetch
          player_id: payload.player_id,
          player_name: null,
          minute: payload.minute,
          created_at: null,
        }
        const withEvent: LiveMatch = {
          ...previous,
          events: [...previous.events, optimistic],
        }
        qc.setQueryData<LiveMatch>(key, applyScoreDelta(withEvent, optimistic, +1))
      }
      return { previous }
    },

    onError: (_err, _payload, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
    },
  })
}

/**
 * Referee: delete a mis-recorded event — DELETE /match-events/{id} (204).
 * Only goal/cards are deletable (markers → 422). OPTIMISTIC removal by event id
 * + score rollback; reconciled by onSettled refetch.
 */
export function useDeleteEvent(matchId: number) {
  const qc = useQueryClient()
  const key = liveKeys.match(matchId)

  return useMutation({
    mutationFn: (eventId: number) =>
      apiClient.delete(`/match-events/${eventId}`),

    onMutate: async (eventId): Promise<EventContext> => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<LiveMatch>(key)
      if (previous) {
        const removed = previous.events.find((e) => e.id === eventId)
        let next: LiveMatch = {
          ...previous,
          events: previous.events.filter((e) => e.id !== eventId),
        }
        if (removed) next = applyScoreDelta(next, removed, -1)
        qc.setQueryData<LiveMatch>(key, next)
      }
      return { previous }
    },

    onError: (_err, _eventId, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
    },
  })
}
