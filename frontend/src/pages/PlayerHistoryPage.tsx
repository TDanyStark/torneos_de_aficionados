import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, Shield, User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, StateMessage } from '@/components/shared/StateMessage'
import { ApiError } from '@/lib/apiClient'
import { usePlayerHistory } from '@/features/teams/api/usePlayerHistory'

export function PlayerHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const playerId = Number(id)
  const { data, isLoading, isError, error } = usePlayerHistory(playerId)

  const isForbidden = error instanceof ApiError && error.status === 403

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      {isLoading ? (
        <>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </>
      ) : isForbidden ? (
        <StateMessage
          icon={<Lock className="size-8" />}
          title="No autorizado"
          description="Solo el organizador dueño puede ver el historial de este jugador."
        />
      ) : isError || !data ? (
        <StateMessage
          icon={<User className="size-8" />}
          title="Jugador no encontrado"
          description="No se pudo cargar el historial del jugador."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {data.player.photo_url ? (
                    <AvatarImage
                      src={data.player.photo_url}
                      alt={data.player.full_name}
                    />
                  ) : null}
                  <AvatarFallback>
                    {data.player.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {data.player.full_name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Cédula {data.player.document_id}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trayectoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
                {data.note ??
                  'Goles y tarjetas estarán disponibles desde la Fase 4.'}
              </div>

              {data.history.length === 0 ? (
                <EmptyState
                  title="Sin historial"
                  description="Este jugador aún no ha participado en torneos."
                />
              ) : (
                <ul className="divide-y rounded-md border">
                  {data.history.map((entry) => (
                    <li
                      key={`${entry.tournament_id}-${entry.team_id}`}
                      className="flex items-center gap-3 p-3"
                    >
                      <Shield className="text-muted-foreground size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {entry.tournament_name}
                          </span>
                          {entry.is_captain === 1 ? (
                            <Badge variant="secondary">Capitán</Badge>
                          ) : null}
                          {entry.is_delegate === 1 ? (
                            <Badge variant="outline">Delegado</Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {entry.team_name}
                          {entry.shirt_number != null
                            ? ` · #${entry.shirt_number}`
                            : ''}
                          {entry.position ? ` · ${entry.position}` : ''}
                        </p>
                      </div>
                      <div className="text-muted-foreground flex gap-3 text-xs">
                        <span>{entry.goals} goles</span>
                        <span>{entry.cards} tarjetas</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
