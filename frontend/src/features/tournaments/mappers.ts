import type { TournamentFormValues } from './schemas'
import type {
  BackendBool,
  CreateTournamentPayload,
  Tournament,
} from './types'

const toBool = (v: boolean): BackendBool => (v ? 1 : 0)
const emptyToNull = (v: string | undefined): string | null =>
  v && v.trim() !== '' ? v : null

/** Form values → create/update API payload (strings→numbers, bools→0/1). */
export function formToPayload(
  values: TournamentFormValues,
): CreateTournamentPayload {
  return {
    sport_id: values.sport_id,
    name: values.name,
    description: emptyToNull(values.description),
    logo_url: emptyToNull(values.logo_url),
    periods_count: Number(values.periods_count),
    points_win: Number(values.points_win),
    points_draw: Number(values.points_draw),
    points_loss: Number(values.points_loss),
    allow_late_registration: toBool(values.allow_late_registration),
    registration_open: toBool(values.registration_open),
    starts_at: emptyToNull(values.starts_at),
    timezone: emptyToNull(values.timezone),
  }
}

/** Tournament entity → form values (numbers→strings, 0/1→boolean, null→''). */
export function tournamentToForm(t: Tournament): TournamentFormValues {
  return {
    name: t.name,
    sport_id: t.sport_id,
    description: t.description ?? '',
    logo_url: t.logo_url ?? '',
    periods_count: String(t.periods_count),
    points_win: String(t.points_win),
    points_draw: String(t.points_draw),
    points_loss: String(t.points_loss),
    allow_late_registration: t.allow_late_registration === 1,
    registration_open: t.registration_open === 1,
    starts_at: t.starts_at ?? '',
    timezone: t.timezone ?? '',
  }
}

export const DEFAULT_TOURNAMENT_FORM: TournamentFormValues = {
  name: '',
  sport_id: 0,
  description: '',
  logo_url: '',
  periods_count: '2',
  points_win: '3',
  points_draw: '1',
  points_loss: '0',
  allow_late_registration: false,
  registration_open: false,
  starts_at: '',
  timezone: '',
}
