import { Megaphone } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Skeleton } from '@/components/ui/skeleton'
import { useTournamentAdSlots } from '../api/useAds'
import { SlotCard } from './SlotCard'

interface TournamentAdsPanelProps {
  tournamentId: number
}

/**
 * Admin panel to manage the ad slots + creatives of a SINGLE tournament,
 * surfaced inside the tournament management view. Slots are auto-seeded on
 * tournament creation (header / between_matches / footer with a default
 * WhatsApp banner), so this panel focuses on editing each slot's creatives —
 * reusing the shared SlotCard (slot edit/delete + creative add/edit/delete
 * with media upload, CTA and validity window). The underlying creative/slot
 * mutations invalidate `adKeys.all`, which refreshes this query automatically.
 */
export function TournamentAdsPanel({ tournamentId }: TournamentAdsPanelProps) {
  const slots = useTournamentAdSlots(tournamentId)
  const items = slots.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="text-brand size-5" />
        <div>
          <h2 className="font-semibold">Publicidad del torneo</h2>
          <p className="text-muted-foreground text-sm">
            Edita los anuncios que se muestran en este torneo.
          </p>
        </div>
      </div>

      {slots.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : slots.isError ? (
        <ErrorState message={slots.error?.message} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin espacios publicitarios"
          description="Este torneo todavía no tiene espacios publicitarios."
        />
      ) : (
        <div className="space-y-4">
          {items.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  )
}
