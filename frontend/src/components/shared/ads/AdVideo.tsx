import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '@/features/ads/mediaUrl'
import type { AdCreative, AdPlacement } from '@/features/ads/types'
import { cn } from '@/lib/utils'

interface AdVideoProps {
  creative: AdCreative
  placement: AdPlacement
}

const HEIGHT_BY_PLACEMENT: Record<AdPlacement, string> = {
  header: 'max-h-24',
  footer: 'max-h-24',
  sidebar: 'max-h-72',
  between_matches: 'max-h-40',
  match_live: 'max-h-40',
}

/**
 * Renders a sold video creative. The <source> is mounted ONLY once the element
 * scrolls into view (IntersectionObserver), so off-screen videos don't download
 * on mobile. We DON'T autoplay (conservative on mobile data); native controls
 * let the user tap-to-play. Click on chrome is handled by the parent link, but
 * the controls remain usable.
 */
export function AdVideo({ creative, placement }: AdVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView])

  return (
    <div ref={containerRef} className="w-full">
      <video
        controls
        muted
        playsInline
        preload="none"
        className={cn(
          'w-full rounded-lg bg-black object-cover',
          HEIGHT_BY_PLACEMENT[placement],
        )}
      >
        {inView ? (
          <source src={mediaUrl(creative.media_url)} type="video/mp4" />
        ) : null}
      </video>
    </div>
  )
}
