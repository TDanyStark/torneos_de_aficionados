import { MessageCircle, Megaphone } from 'lucide-react'
import type { AdCreative } from '@/features/ads/types'

interface AdDefaultBannerProps {
  creative: AdCreative
}

/**
 * The "Este espacio está disponible" placeholder shown when a slot has no sold
 * creative. Tasteful, dark-mode-aware, mobile-first; the CTA links to the
 * admin's WhatsApp (creative.cta_url). This is the monetization hook — it should
 * look intentional, not broken.
 */
export function AdDefaultBanner({ creative }: AdDefaultBannerProps) {
  const label = creative.cta_label || 'Este espacio está disponible'
  const href = creative.cta_url ?? undefined

  return (
    <div className="bg-muted/40 text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-4 text-center sm:flex-row sm:justify-between sm:gap-3 sm:text-left">
      <div className="flex items-center gap-2">
        <Megaphone className="text-brand size-4 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand/10 text-brand hover:bg-brand/20 inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <MessageCircle className="size-4" />
          Anúnciate aquí
        </a>
      ) : null}
    </div>
  )
}
