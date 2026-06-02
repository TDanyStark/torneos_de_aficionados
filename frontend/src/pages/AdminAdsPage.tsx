import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Megaphone, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdSlots } from '@/features/ads/api/useAds'
import { SlotCard } from '@/features/ads/components/SlotCard'
import { SlotDialog } from '@/features/ads/components/SlotDialog'

/** Global admin panel to manage ad slots + creatives across the platform. */
export function AdminAdsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const [creatingSlot, setCreatingSlot] = useState(false)

  const slots = useAdSlots(page)

  const setPage = (next: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set('page', String(next))
      return params
    })
  }

  const items = slots.data?.items ?? []
  const totalPages = slots.data?.pagination.total_pages ?? 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="text-brand size-6" />
          <h1 className="text-xl font-semibold">Publicidad</h1>
        </div>
        <Button size="sm" onClick={() => setCreatingSlot(true)}>
          <Plus className="size-4" />
          Nuevo slot
        </Button>
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
          title="Sin slots publicitarios"
          description="Crea tu primer slot para empezar a monetizar."
          action={
            <Button size="sm" onClick={() => setCreatingSlot(true)}>
              <Plus className="size-4" />
              Nuevo slot
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {items.map((slot) => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <SlotDialog
        open={creatingSlot}
        onOpenChange={setCreatingSlot}
        onSaved={() => toast.success('Slot creado')}
      />
    </div>
  )
}
