import type { CreateTournamentValues, TournamentFormValues } from './schemas'
import type {
  BackendBool,
  CreateTournamentMinimalPayload,
  Prizes,
  Tournament,
  UpdateTournamentPayload,
} from './types'

const toBool = (v: boolean): BackendBool => (v ? 1 : 0)
const emptyToNull = (v: string | undefined): string | null =>
  v && v.trim() !== '' ? v : null

/**
 * Builds the prizes object from the flat form fields. Empty strings become
 * omitted/null; if every placement is empty the whole map is `null` (matches
 * the backend's normalization).
 */
function formToPrizes(values: TournamentFormValues): Prizes | null {
  const first = emptyToNull(values.prize_first)
  const second = emptyToNull(values.prize_second)
  const third = emptyToNull(values.prize_third)
  const others = emptyToNull(values.prize_others)
  if (!first && !second && !third && !others) return null
  const prizes: Prizes = {}
  if (first) prizes.first = first
  if (second) prizes.second = second
  if (third) prizes.third = third
  if (others) prizes.others = others
  return prizes
}

/** Form values → update API payload (strings→numbers, bools→0/1, prizes map). */
export function formToPayload(
  values: TournamentFormValues,
): UpdateTournamentPayload {
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
    is_public: values.is_public,
    slug: values.slug,
    roster_limit: values.roster_limit ? Number(values.roster_limit) : null,
    starts_at: emptyToNull(values.starts_at),
    ends_at: emptyToNull(values.ends_at),
    timezone: emptyToNull(values.timezone),
    rules: emptyToNull(values.rules),
    registration_info: emptyToNull(values.registration_info),
    prizes: formToPrizes(values),
    suspension_red_card: values.suspension_red_card,
    suspension_double_yellow: values.suspension_double_yellow,
  }
}

/** Minimal create form values → minimal create payload (sport + name only). */
export function createToPayload(
  values: CreateTournamentValues,
): CreateTournamentMinimalPayload {
  return {
    sport_id: values.sport_id,
    name: values.name,
  }
}

/**
 * Normalizes a backend datetime to the `YYYY-MM-DD` shape the date inputs use.
 * Backend `starts_at`/`ends_at` may include a time component.
 */
const toDateInput = (v: string | null): string => (v ? v.slice(0, 10) : '')

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
    allow_late_registration: Boolean(t.allow_late_registration),
    registration_open: Boolean(t.registration_open),
    is_public: Boolean(t.is_public),
    slug: t.slug,
    roster_limit: t.roster_limit != null ? String(t.roster_limit) : '',
    starts_at: toDateInput(t.starts_at),
    ends_at: toDateInput(t.ends_at),
    timezone: t.timezone ?? '',
    rules: t.rules ?? '',
    registration_info: t.registration_info ?? '',
    prize_first: t.prizes?.first ?? '',
    prize_second: t.prizes?.second ?? '',
    prize_third: t.prizes?.third ?? '',
    prize_others: t.prizes?.others ?? '',
    suspension_red_card: t.suspension_red_card,
    suspension_double_yellow: t.suspension_double_yellow,
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
  registration_open: true,
  is_public: false,
  slug: '',
  roster_limit: '',
  starts_at: '',
  ends_at: '',
  timezone: '',
  rules: '',
  registration_info: '',
  prize_first: '',
  prize_second: '',
  prize_third: '',
  prize_others: '',
  suspension_red_card: false,
  suspension_double_yellow: false,
}
