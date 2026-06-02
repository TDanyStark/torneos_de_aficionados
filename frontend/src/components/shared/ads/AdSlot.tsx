import { useAds } from '@/features/ads/api/useAds'
import type { AdPlacement } from '@/features/ads/types'
import { cn } from '@/lib/utils'
import { AdDefaultBanner } from './AdDefaultBanner'
import { AdImage } from './AdImage'
import { AdVideo } from './AdVideo'

interface AdSlotProps {
  placement: AdPlacement
  /** Resolve tournament-scoped ads (with global fallback). */
  tournamentId?: number
  className?: string
}

/**
 * Renders the resolved ad for a placement, or NOTHING when no slot/creative is
 * serveable (no layout shift). Default creatives render the WhatsApp banner;
 * sold creatives render image/video. Sold creatives with a cta_url are wrapped
 * in a new-tab link — EXCEPT video, whose native controls must stay clickable.
 */
export function AdSlot({ placement, tournamentId, className }: AdSlotProps) {
  const { data } = useAds(tournamentId)
  const resolved = data?.[placement]

  // Nothing to show (loading or empty) → render nothing, no reserved space.
  if (!resolved) return null

  const { creative } = resolved

  if (creative.is_default === 1) {
    return (
      <div className={cn('w-full', className)}>
        <AdDefaultBanner creative={creative} />
      </div>
    )
  }

  const isVideo = creative.media_type === 'video'
  const media = isVideo ? (
    <AdVideo creative={creative} placement={placement} />
  ) : (
    <AdImage creative={creative} placement={placement} />
  )

  // Video keeps its native controls clickable → no wrapping anchor.
  if (creative.cta_url && !isVideo) {
    return (
      <a
        href={creative.cta_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={creative.cta_label ?? 'Publicidad'}
        className={cn('block w-full', className)}
      >
        {media}
      </a>
    )
  }

  return <div className={cn('w-full', className)}>{media}</div>
}
