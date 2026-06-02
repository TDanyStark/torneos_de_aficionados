import type { AdCreativeFormValues, AdSlotFormValues } from './schemas'
import type {
  AdCreative,
  AdSlot,
  BackendBool,
  CreateAdCreativePayload,
  CreateAdSlotPayload,
  UpdateAdCreativePayload,
  UpdateAdSlotPayload,
} from './types'

const toBool = (v: boolean): BackendBool => (v ? 1 : 0)
const emptyToNull = (v: string | undefined): string | null =>
  v && v.trim() !== '' ? v : null

/** datetime-local ('YYYY-MM-DDTHH:mm') → backend 'YYYY-MM-DD HH:mm:ss' | null. */
const toBackendDateTime = (v: string | undefined): string | null => {
  if (!v || v.trim() === '') return null
  // Replace the 'T' separator; append seconds if absent.
  const normalized = v.replace('T', ' ')
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

/** backend 'YYYY-MM-DD HH:mm:ss' | null → datetime-local 'YYYY-MM-DDTHH:mm'. */
const toLocalDateTime = (v: string | null): string => {
  if (!v) return ''
  return v.replace(' ', 'T').slice(0, 16)
}

/* ------------------------------------------------------------------ */
/* Slot                                                                 */
/* ------------------------------------------------------------------ */

export function slotFormToCreatePayload(
  values: AdSlotFormValues,
): CreateAdSlotPayload {
  const tournamentId = emptyToNull(values.tournament_id)
  return {
    placement: values.placement,
    name: values.name.trim(),
    tournament_id: tournamentId === null ? null : Number(tournamentId),
    is_active: toBool(values.is_active),
  }
}

export function slotFormToUpdatePayload(
  values: AdSlotFormValues,
): UpdateAdSlotPayload {
  return {
    placement: values.placement,
    name: values.name.trim(),
    is_active: toBool(values.is_active),
  }
}

export function slotToForm(slot: AdSlot): AdSlotFormValues {
  return {
    placement: slot.placement,
    name: slot.name,
    tournament_id: slot.tournament_id != null ? String(slot.tournament_id) : '',
    is_active: slot.is_active === 1,
  }
}

/* ------------------------------------------------------------------ */
/* Creative                                                             */
/* ------------------------------------------------------------------ */

export function creativeFormToCreatePayload(
  values: AdCreativeFormValues,
  adSlotId: number,
): CreateAdCreativePayload {
  return {
    ad_slot_id: adSlotId,
    media_type: values.media_type,
    media_url: values.media_url,
    cta_url: emptyToNull(values.cta_url),
    cta_label: emptyToNull(values.cta_label),
    is_active: toBool(values.is_active),
    starts_at: toBackendDateTime(values.starts_at),
    ends_at: toBackendDateTime(values.ends_at),
  }
}

export function creativeFormToUpdatePayload(
  values: AdCreativeFormValues,
): UpdateAdCreativePayload {
  return {
    media_type: values.media_type,
    media_url: values.media_url,
    cta_url: emptyToNull(values.cta_url),
    cta_label: emptyToNull(values.cta_label),
    is_active: toBool(values.is_active),
    starts_at: toBackendDateTime(values.starts_at),
    ends_at: toBackendDateTime(values.ends_at),
  }
}

export function creativeToForm(creative: AdCreative): AdCreativeFormValues {
  return {
    media_type: creative.media_type,
    media_url: creative.media_url,
    cta_url: creative.cta_url ?? '',
    cta_label: creative.cta_label ?? '',
    is_active: creative.is_active === 1,
    starts_at: toLocalDateTime(creative.starts_at),
    ends_at: toLocalDateTime(creative.ends_at),
  }
}
