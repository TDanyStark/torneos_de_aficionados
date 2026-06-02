/**
 * Live-match + statistics domain types — mirror the Fase 5 backend JSON shapes
 * EXACTLY (snake_case). Verified against engram sdd/fase-5/apply-backend-b.
 *
 * Envelope: { success, data, meta?:{pagination} }. Markers (period_start /
 * period_end) carry null team/player/names.
 */

import type { MatchStatus } from '@/features/fixtures/types'

export type { MatchStatus }

/* ------------------------------------------------------------------ */
/* Periods + events                                                    */
/* ------------------------------------------------------------------ */

export type MatchPeriodStatus = 'pending' | 'running' | 'finished'

/** A single period of a match — MatchPeriod jsonSerialize (number ASC). */
export interface MatchPeriod {
  id: number
  match_id: number
  number: number
  status: MatchPeriodStatus
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

/** The currently running period (subset returned in /live), or null. */
export interface ActivePeriod {
  id: number
  number: number
  status: 'running'
  started_at: string | null
}

/**
 * Recordable + marker event types. The referee form only emits the first four;
 * `period_start` / `period_end` are written server-side and only ever read.
 */
export type EventType =
  | 'goal'
  | 'own_goal'
  | 'yellow_card'
  | 'red_card'
  | 'period_start'
  | 'period_end'

/** The four event types a referee can record via the events form. */
export type RecordableEventType = 'goal' | 'own_goal' | 'yellow_card' | 'red_card'

/** A timeline event — GET /matches/{id}/live data.events (id ASC). */
export interface MatchEvent {
  id: number
  match_id: number
  match_period_id: number | null
  type: EventType
  team_id: number | null
  team_name: string | null
  player_id: number | null
  player_name: string | null
  minute: number | null
  created_at: string | null
}

/* ------------------------------------------------------------------ */
/* Live match snapshot                                                 */
/* ------------------------------------------------------------------ */

/** The neutral `match` row returned inside /live. */
export interface LiveMatchRow {
  id: number
  tournament_id: number
  status: MatchStatus
  home_team_id: number | null
  away_team_id: number | null
  home_score: number | null
  away_score: number | null
  winner_team_id: number | null
  started_at: string | null
  finished_at: string | null
  scheduled_at: string | null
  referee_user_id: number | null
}

/** Derived (live/paused) or stored (finished) scoreboard. */
export interface LiveScore {
  home: number
  away: number
}

/** Full snapshot — GET /matches/{id}/live data. */
export interface LiveMatch {
  match: LiveMatchRow
  score: LiveScore
  active_period: ActivePeriod | null
  periods: MatchPeriod[]
  events: MatchEvent[]
}

/** Body of POST /matches/{id}/events. */
export interface RecordEventPayload {
  type: RecordableEventType
  team_id: number
  player_id: number
  minute: number
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

/** A row of GET /tournaments/{id}/top-scorers (goals DESC, own_goal excluded). */
export interface TopScorer {
  player_id: number
  player_name: string
  team_id: number | null
  team_name: string | null
  goals: number
}

/** A row of GET /tournaments/{id}/cards (reds DESC, yellows DESC). */
export interface CardRow {
  player_id: number
  player_name: string
  team_id: number | null
  team_name: string | null
  yellow_cards: number
  red_cards: number
}
