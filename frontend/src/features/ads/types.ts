/**
 * Ads domain types — mirror the backend JSON shapes exactly (snake_case).
 * Backend booleans serialize as 0 | 1 tinyints (BackendBool).
 */

/** A fixed UI position an ad can occupy. */
export type AdPlacement =
  | 'header'
  | 'sidebar'
  | 'between_matches'
  | 'footer'
  | 'match_live'

/** Creative media kind. */
export type MediaType = 'image' | 'video'

/** Backend booleans are emitted as 0 | 1 tinyints. */
export type BackendBool = 0 | 1

/** An ad slot — a placement, optionally scoped to a tournament. */
export interface AdSlot {
  id: number
  /** Null = global slot (applies app-wide). */
  tournament_id: number | null
  placement: AdPlacement
  name: string
  is_active: BackendBool
  created_at: string
  updated_at: string
}

/** A creative served in a slot: media + optional CTA, or the default banner. */
export interface AdCreative {
  id: number
  ad_slot_id: number
  media_type: MediaType
  /** Relative path (e.g. `/uploads/ads/<file>`). Empty for the default banner. */
  media_url: string
  cta_url: string | null
  cta_label: string | null
  /** 1 = the "espacio disponible" WhatsApp banner (not deletable). */
  is_default: BackendBool
  is_active: BackendBool
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

/** A resolved placement → the slot + the single creative to render. */
export interface ResolvedAd {
  placement: AdPlacement
  slot: AdSlot
  creative: AdCreative
}

/**
 * Public ads response: an object keyed by placement. Placements with nothing
 * serveable are ABSENT — hence the Partial.
 */
export type AdsMap = Partial<Record<AdPlacement, ResolvedAd>>

/** Admin list item: a slot with ALL its creatives inline. */
export type AdSlotWithCreatives = AdSlot & {
  creatives: AdCreative[]
}

/* ------------------------------------------------------------------ */
/* Request payloads (write operations)                                 */
/* ------------------------------------------------------------------ */

export interface CreateAdSlotPayload {
  placement: AdPlacement
  name: string
  tournament_id?: number | null
  is_active?: BackendBool
}

export interface UpdateAdSlotPayload {
  name?: string
  placement?: AdPlacement
  is_active?: BackendBool
}

export interface CreateAdCreativePayload {
  ad_slot_id: number
  media_type: MediaType
  media_url: string
  cta_url?: string | null
  cta_label?: string | null
  is_active?: BackendBool
  starts_at?: string | null
  ends_at?: string | null
}

export type UpdateAdCreativePayload = Partial<
  Omit<CreateAdCreativePayload, 'ad_slot_id'>
>

/** Response of POST /ad-creatives/upload. */
export interface UploadMediaResponse {
  media_url: string
  media_type: MediaType
}
