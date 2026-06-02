import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useStages } from '@/features/tournaments/api/useStages'
import { GenerateFixtureDialog } from '@/features/fixtures/components/GenerateFixtureDialog'
import { RegenerateFixtureDialog } from '@/features/fixtures/components/RegenerateFixtureDialog'
import type { StageType } from '@/features/tournaments/types'

const STAGE_TYPE_LABELS: Record<StageType, string> = {
  league: 'Liga',
  groups: 'Grupos',
  knockout: 'Eliminación',
}

export function StageFixturesPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const stages = useStages(
    Number.isFinite(tournamentId) && tournamentId > 0
      ? tournamentId
      : undefined,
  )

  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
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
        <Layers className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Fixtures por fase</h1>
      </div>

      <p className="text-muted-foreground text-sm">
        Genera el calendario de cada fase. Si ya existe, usa{' '}
        <strong>Regenerar</strong> para integrar inscripciones tardías
        conservando lo ya jugado.
      </p>

      {stages.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : stages.isError ? (
        <ErrorState message="No se pudieron cargar las fases." />
      ) : !stages.data || stages.data.length === 0 ? (
        <EmptyState
          title="Sin fases"
          description="Configura las fases del torneo antes de generar fixtures."
        />
      ) : (
        <div className="space-y-3">
          {stages.data.map((stage) => (
            <Card key={stage.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{stage.name}</CardTitle>
                  <Badge variant="outline">
                    {STAGE_TYPE_LABELS[stage.type]}
                    {stage.legs === 2 ? ' · Ida y vuelta' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <GenerateFixtureDialog
                  tournamentId={tournamentId}
                  stage={stage}
                />
                <RegenerateFixtureDialog
                  tournamentId={tournamentId}
                  stage={stage}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
