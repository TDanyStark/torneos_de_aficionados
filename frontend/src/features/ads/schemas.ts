import { z } from 'zod'
import type { AdPlacement, MediaType } from './types'

const PLACEMENTS: [AdPlacement, ...AdPlacement[]] = [
  'header',
  'sidebar',
  'between_matches',
  'footer',
  'match_live',
]

const MEDIA_TYPES: [MediaType, ...MediaType[]] = ['image', 'video']

/** Optional unsigned-int kept as a string from a number input ('' = none). */
const optionalIntString = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === '' || /^\d+$/.test(v),
    'Debe ser un número entero',
  )

/* ------------------------------------------------------------------ */
/* Slot form                                                            */
/* ------------------------------------------------------------------ */

export const adSlotSchema = z.object({
  placement: z.enum(PLACEMENTS),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  /** '' = global slot. */
  tournament_id: optionalIntString,
  is_active: z.boolean(),
})

export type AdSlotFormValues = z.infer<typeof adSlotSchema>

export const DEFAULT_AD_SLOT_FORM: AdSlotFormValues = {
  placement: 'header',
  name: '',
  tournament_id: '',
  is_active: true,
}

/* ------------------------------------------------------------------ */
/* Creative form                                                        */
/* ------------------------------------------------------------------ */

export const adCreativeSchema = z
  .object({
    media_type: z.enum(MEDIA_TYPES),
    media_url: z.string().min(1, 'Sube una imagen o video'),
    cta_url: z
      .string()
      .url('URL inválida')
      .optional()
      .or(z.literal('')),
    cta_label: z.string().max(80, 'Máximo 80 caracteres').optional().or(z.literal('')),
    is_active: z.boolean(),
    /** datetime-local string ('' = none). */
    starts_at: z.string().optional().or(z.literal('')),
    ends_at: z.string().optional().or(z.literal('')),
  })
  .refine(
    (v) =>
      !v.starts_at ||
      !v.ends_at ||
      new Date(v.ends_at).getTime() >= new Date(v.starts_at).getTime(),
    {
      message: 'La fecha de fin debe ser posterior al inicio',
      path: ['ends_at'],
    },
  )

export type AdCreativeFormValues = z.infer<typeof adCreativeSchema>

export const DEFAULT_AD_CREATIVE_FORM: AdCreativeFormValues = {
  media_type: 'image',
  media_url: '',
  cta_url: '',
  cta_label: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
}
