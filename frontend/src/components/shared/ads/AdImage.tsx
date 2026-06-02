import { mediaUrl } from '@/features/ads/mediaUrl'
import type { AdCreative, AdPlacement } from '@/features/ads/types'
import { cn } from '@/lib/utils'

interface AdImageProps {
  creative: AdCreative
  placement: AdPlacement
}

/** Per-placement max heights keep banners proportionate and non-intrusive. */
const HEIGHT_BY_PLACEMENT: Record<AdPlacement, string> = {
  header: 'max-h-24',
  footer: 'max-h-24',
  sidebar: 'max-h-72',
  between_matches: 'max-h-28',
  match_live: 'max-h-28',
}

/** Renders a sold image creative. Click is handled by the parent <AdSlot> link. */
export function AdImage({ creative, placement }: AdImageProps) {
  return (
    <img
      src={mediaUrl(creative.media_url)}
      alt={creative.cta_label ?? 'Publicidad'}
      loading="lazy"
      className={cn(
        'w-full rounded-lg object-cover',
        HEIGHT_BY_PLACEMENT[placement],
      )}
    />
  )
}
