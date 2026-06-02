import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { TournamentLogo } from '@/features/tournaments/components/TournamentLogo'
import { RegistrationStatusBadge } from '@/features/teams/components/RegistrationStatusBadge'
import { useMyRegistrations } from '@/features/teams/api/useRegistrations'

export function MyRegistrationsPage() {
  const { data, isLoading, isError, error } = useMyRegistrations()

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardList className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Mis inscripciones</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Torneos en los que inscribiste un equipo. Aquí puedes ver el estado de
        cada inscripción.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Aún no tienes inscripciones"
          description="Cuando inscribas un equipo en un torneo, aparecerá aquí con su estado."
        />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.registration_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <TournamentLogo
                      name={item.tournament_name}
                      logoUrl={item.tournament_logo_url}
                      seed={item.tournament_id}
                    />
                    <div>
                      <CardTitle className="text-base">
                        {item.tournament_name}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Equipo: {item.team_name}
                      </p>
                    </div>
                  </div>
                  <RegistrationStatusBadge status={item.registration_status} />
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {item.registration_status === 'pending' ||
                item.registration_status === 'submitted'
                  ? 'Tu inscripción está pendiente de aprobación por el organizador.'
                  : item.registration_status === 'approved'
                    ? 'Tu equipo fue aprobado para participar.'
                    : 'Tu inscripción fue rechazada por el organizador.'}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/t/${item.tournament_slug}`}>Ver torneo</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
