import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import {
  useRegistrations,
  useDecideRegistration,
} from '@/features/teams/api/useRegistrations'
import { useTournamentBySlug } from '@/features/tournaments/api/useTournaments'
import { useRegistrationFilters } from '@/features/teams/hooks/useRegistrationFilters'
import { RegistrationCard } from '@/features/teams/components/RegistrationCard'

export function RegistrationsInboxPage() {
  const { slug } = useParams<{ slug: string }>()
  const tournament = useTournamentBySlug(slug)
  const tournamentId = tournament.data?.id ?? 0
  const { filters, setFilters } = useRegistrationFilters()
  const { data, isLoading, isError, error } = useRegistrations(
    tournamentId,
    filters,
  )
  const decide = useDecideRegistration()
  const [pendingId, setPendingId] = useState<number | null>(null)

  const onDecide = async (
    registrationId: number,
    status: 'approved' | 'rejected',
  ) => {
    setPendingId(registrationId)
    try {
      await decide.mutateAsync({ registrationId, status })
      toast.success(
        status === 'approved'
          ? 'Inscripción aprobada'
          : 'Inscripción rechazada',
      )
    } catch {
      toast.error('No se pudo procesar la inscripción')
    } finally {
      setPendingId(null)
    }
  }

  if (tournament.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  if (tournament.isError || !tournament.data) {
    return <ErrorState message="Torneo inválido." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <Inbox className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Bandeja de inscripciones</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Sin inscripciones"
          description="Cuando un delegado se inscriba aparecerá aquí."
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                pending={pendingId === registration.id}
                onApprove={(rid) => onDecide(rid, 'approved')}
                onReject={(rid) => onDecide(rid, 'rejected')}
              />
            ))}
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            onChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  )
}
